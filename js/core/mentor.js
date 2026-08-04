/**
 * mentor.js — наставник: прогрессивные подсказки и разбор ошибок.
 *
 * ВАЖНО ОБ ЧЕСТНОСТИ: живого AI здесь нет и он не имитируется.
 * Работают два уровня:
 *   1. Локальный наставник (работает всегда) — прогрессивные подсказки из контента
 *      задачи и разбор типичных ошибок Python/SQL по тексту исключения.
 *   2. AI-провайдер (опционально) — подключается через setProvider(); если провайдер
 *      не настроен, интерфейс честно сообщает об этом и НЕ выдумывает ответы.
 *
 * Провайдер намеренно абстрактный: ключ никогда не попадает во фронтенд,
 * запрос уходит на собственный бэкенд, который и общается с моделью.
 */
import { t, tr } from './i18n.js';

let provider = null;

/** Подключение реального AI-провайдера. Ожидается объект с методами explain/hint/review. */
export function setProvider(impl) { provider = impl; }
export function hasProvider() { return !!provider; }

/* ---------- 1. Прогрессивные подсказки ---------- */

/**
 * Уровни подсказки для задачи:
 *   0 — направление мысли (из чего складывается решение)
 *   1 — конкретная подсказка автора задачи (task.hint)
 *   2 — скелет решения (стартовый код с комментариями)
 *   3 — предложение посмотреть теорию модуля
 * Полное решение не выдаётся никогда: задача — научить, а не закрыть.
 */
export function hintLevels(task) {
  const levels = [];

  levels.push({
    level: 1,
    kind: 'direction',
    text: task.kind === 'sql'
      ? t('mentor.dirSql')
      : t('mentor.dirPython'),
  });

  if (task.hint) {
    levels.push({ level: 2, kind: 'hint', text: tr(task.hint) });
  }

  if (task.starter && task.starter.trim()) {
    levels.push({ level: 3, kind: 'skeleton', code: task.starter });
  }

  levels.push({ level: levels.length + 1, kind: 'theory', text: t('mentor.backToTheory') });
  return levels;
}

/* ---------- 2. Разбор ошибок без AI ---------- */

/**
 * Типичные ошибки новичка. Ключ — сигнатура в тексте исключения,
 * значение — ключ понятного объяснения в словаре интерфейса.
 * Это не «умный ИИ», а честная таблица частых случаев — зато работает всегда.
 */
const PY_PATTERNS = [
  [/IndentationError|expected an indented block/i, 'mentor.err.indent'],
  [/SyntaxError.*invalid syntax/i, 'mentor.err.syntax'],
  [/NameError: name '(\w+)' is not defined/i, 'mentor.err.name'],
  [/TypeError: can only concatenate str/i, 'mentor.err.concat'],
  // реальные формулировки CPython при арифметике со строкой
  [/TypeError: unsupported operand type\(s\) for [+\-*/]+: '(?:str|int|float)' and '(?:str|int|float)'/i, 'mentor.err.strMath'],
  [/TypeError: can't multiply sequence by non-int/i, 'mentor.err.strMath'],
  [/TypeError: '[<>=]+' not supported between instances of/i, 'mentor.err.compare'],
  [/TypeError: '(\w+)' object is not subscriptable/i, 'mentor.err.subscript'],
  [/IndexError: list index out of range/i, 'mentor.err.index'],
  [/KeyError/i, 'mentor.err.key'],
  [/ZeroDivisionError/i, 'mentor.err.zero'],
  [/ValueError: invalid literal for int/i, 'mentor.err.int'],
  [/AttributeError: '(\w+)' object has no attribute/i, 'mentor.err.attr'],
  [/RecursionError/i, 'mentor.err.recursion'],
  [/TypeError:.*missing \d+ required positional argument/i, 'mentor.err.args'],
  [/UnboundLocalError/i, 'mentor.err.unbound'],
];

const SQL_PATTERNS = [
  [/no such table: (\w+)/i, 'mentor.sql.noTable'],
  [/no such column: ([\w.]+)/i, 'mentor.sql.noColumn'],
  [/near "(\w+)": syntax error/i, 'mentor.sql.syntax'],
  [/ambiguous column name/i, 'mentor.sql.ambiguous'],
  [/misuse of aggregate/i, 'mentor.sql.aggregate'],
  [/UNIQUE constraint failed/i, 'mentor.sql.unique'],
];

/**
 * Объясняет ошибку по-человечески. Возвращает { text, matched } —
 * matched=false означает, что шаблон не найден и текст общий (без выдумок).
 */
export function explainError(message, kind) {
  const patterns = kind === 'sql' ? SQL_PATTERNS : PY_PATTERNS;
  for (const [re, key] of patterns) {
    const m = String(message).match(re);
    if (m) {
      return { text: t(key, { name: m[1] || '' }), matched: true };
    }
  }
  return { text: t('mentor.err.generic'), matched: false };
}

/* ---------- 3. AI-слой (только если подключён провайдер) ---------- */

/** Объяснение концепции своими словами. Без провайдера — честный отказ. */
export async function explain(topic, level) {
  if (!provider) return { available: false, text: t('mentor.notConfigured') };
  const text = await provider.explain({ topic, level, lang: undefined });
  return { available: true, text };
}

/** Разбор кода ученика: что не так и как думать дальше (не готовое решение). */
export async function review(code, task) {
  if (!provider) return { available: false, text: t('mentor.notConfigured') };
  const text = await provider.review({ code, task });
  return { available: true, text };
}

/** Подсказка нужного уровня: сначала локальные, при провайдере — адаптивные. */
export async function hint(task, level) {
  const local = hintLevels(task);
  if (level < local.length || !provider) {
    return { available: true, source: 'local', ...local[Math.min(level, local.length - 1)] };
  }
  const text = await provider.hint({ task, level });
  return { available: true, source: 'ai', kind: 'ai', text };
}
