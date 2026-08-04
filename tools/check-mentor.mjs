/**
 * check-mentor.mjs — проверка наставника: прогрессивные подсказки и разбор ошибок.
 *
 * Главное, что проверяем: без AI-провайдера наставник работает и НЕ выдумывает ответы,
 * а объяснения ошибок соответствуют реальным сообщениям Python и SQLite.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { JSDOM } from 'jsdom';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const fails = [];
function check(name, cond, extra) {
  if (cond) console.log('  ok:', name);
  else fails.push(name + (extra !== undefined ? ' | ' + extra : ''));
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://course.azizbek-azimov.uz/' });
const w = dom.window;
globalThis.window = w;
globalThis.document = w.document;
globalThis.localStorage = w.localStorage;
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true, writable: true });
w.PQ_VERSION = 'test';
globalThis.fetch = async (url) => {
  const clean = String(url).split('?')[0].replace(/^\.?\//, '');
  const file = path.join(ROOT, clean);
  if (!fs.existsSync(file)) return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
  const body = fs.readFileSync(file, 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(body), text: async () => body };
};

const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const i18n = await imp('js/core/i18n.js');
const mentor = await imp('js/core/mentor.js');

await i18n.initI18n();
await i18n.setLang('ru');

/* ---------- прогрессивные подсказки ---------- */
const pyTask = {
  kind: 'python',
  hint: { ru: 'Используй цикл for и переменную-копилку' },
  starter: 'total = 0\n# твой код\n',
};
const levels = mentor.hintLevels(pyTask);
check('подсказки: несколько уровней', levels.length >= 4, levels.length);
check('подсказки: первый уровень — направление мысли, не ответ', levels[0].kind === 'direction');
check('подсказки: второй уровень — подсказка автора', levels[1].kind === 'hint' && /копилку/.test(levels[1].text));
check('подсказки: третий уровень — скелет кода', levels[2].kind === 'skeleton' && levels[2].code.includes('total'));
check('подсказки: последний уровень отправляет в теорию', levels[levels.length - 1].kind === 'theory');
check('подсказки: готовое решение НЕ выдаётся',
  !levels.some(l => l.kind === 'solution' || (l.text && /решение:/i.test(l.text))));

const sqlTask = { kind: 'sql', starter: '-- запрос\n' };
const sqlLevels = mentor.hintLevels(sqlTask);
check('подсказки SQL: направление про таблицы и WHERE', /WHERE/.test(sqlLevels[0].text));
check('подсказки: задача без hint тоже даёт уровни', sqlLevels.length >= 3, sqlLevels.length);

/* ---------- разбор ошибок Python (реальные сообщения) ---------- */
const pyCases = [
  ['IndentationError: expected an indented block after \'for\' statement on line 1', 'отступ'],
  ['SyntaxError: invalid syntax', 'двоеточие'],
  ["NameError: name 'total' is not defined", 'total'],
  ['TypeError: can only concatenate str (not "int") to str', 'str(x)'],
  ['IndexError: list index out of range', 'индекс'],
  ["KeyError: 'xp'", 'ключ'],
  ['ZeroDivisionError: division by zero', 'ноль'],
  ["ValueError: invalid literal for int() with base 10: 'abc'", 'int()'],
  ['RecursionError: maximum recursion depth exceeded', 'рекурс'],
  ["AttributeError: 'list' object has no attribute 'push'", 'list'],
];
pyCases.forEach(([msg, expect]) => {
  const r = mentor.explainError(msg, 'python');
  check('ошибка Python: ' + msg.split(':')[0], r.matched && r.text.toLowerCase().includes(expect.toLowerCase()),
    r.text.slice(0, 60));
});

/* ---------- разбор ошибок SQL ---------- */
const sqlCases = [
  ['no such table: userz', 'userz'],
  ['no such column: prise', 'prise'],
  ['near "FORM": syntax error', 'FORM'],
  ['ambiguous column name: name', 'нескольких'],
  ['misuse of aggregate: COUNT()', 'HAVING'],
];
sqlCases.forEach(([msg, expect]) => {
  const r = mentor.explainError(msg, 'sql');
  check('ошибка SQL: ' + msg.slice(0, 22), r.matched && r.text.includes(expect), r.text.slice(0, 60));
});

/* ---------- РЕАЛЬНЫЕ сообщения CPython 3.11+ (собраны прогоном настоящего кода) ---------- */
const REAL_PY = [
  "IndentationError: expected an indented block after 'for' statement on line 1",
  "SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?",
  "NameError: name 'total' is not defined",
  'TypeError: can only concatenate str (not "int") to str',
  "TypeError: can't multiply sequence by non-int of type 'float'",
  "IndexError: list index out of range",
  "KeyError: 'xp'",
  "ZeroDivisionError: division by zero",
  "ValueError: invalid literal for int() with base 10: 'abc'",
  "AttributeError: 'list' object has no attribute 'push'",
  "TypeError: f() missing 1 required positional argument: 'b'",
  "UnboundLocalError: cannot access local variable 'x' where it is not associated with a value",
  "TypeError: 'int' object is not subscriptable",
  "TypeError: unsupported operand type(s) for +: 'int' and 'str'",
  "TypeError: '<' not supported between instances of 'str' and 'int'",
];
const unmatched = REAL_PY.filter(m => !mentor.explainError(m, 'python').matched);
check('все ' + REAL_PY.length + ' реальных ошибок Python распознаны', unmatched.length === 0, unmatched.join(' | '));

/* Реальные сообщения SQLite (проверены на sql.js) */
const REAL_SQL = [
  'no such table: userz',
  'no such column: prise',
  'near "FORM": syntax error',
  'ambiguous column name: name',
  'misuse of aggregate function COUNT()',
];
const unmatchedSql = REAL_SQL.filter(m => !mentor.explainError(m, 'sql').matched);
check('все ' + REAL_SQL.length + ' реальных ошибок SQLite распознаны', unmatchedSql.length === 0, unmatchedSql.join(' | '));

/* ---------- неизвестная ошибка: общий, но честный ответ ---------- */
const unknown = mentor.explainError('SomeWeirdError: totally unexpected', 'python');
check('неизвестная ошибка: matched=false (не выдумываем)', unknown.matched === false);
check('неизвестная ошибка: даёт общий совет как читать traceback', unknown.text.length > 20);

/* ---------- AI-слой без провайдера ---------- */
check('AI: провайдер не подключён', mentor.hasProvider() === false);
const ex = await mentor.explain('рекурсия', 'beginner');
check('AI: explain честно сообщает об отсутствии', ex.available === false && /не подключён/.test(ex.text));
const rev = await mentor.review('print(1)', pyTask);
check('AI: review честно сообщает об отсутствии', rev.available === false);
check('AI: выдуманного ответа НЕТ', !/рекурсия — это/i.test(ex.text));

/* ---------- подсказки работают и без провайдера ---------- */
const h0 = await mentor.hint(pyTask, 0);
check('hint(0) работает без AI', h0.available === true && h0.source === 'local');
const hLast = await mentor.hint(pyTask, 99);
check('hint за пределами уровней не падает', hLast.available === true);

/* ---------- локализация объяснений ---------- */
await i18n.setLang('en');
const enErr = mentor.explainError('IndexError: list index out of range', 'python');
check('объяснения переведены на английский', /index/i.test(enErr.text) && !/индекс/.test(enErr.text), enErr.text.slice(0, 50));
await i18n.setLang('uz');
const uzErr = mentor.explainError('ZeroDivisionError: division by zero', 'python');
check('объяснения переведены на узбекский', /Nolga/i.test(uzErr.text), uzErr.text.slice(0, 50));
await i18n.setLang('ru');

if (fails.length) {
  console.log('\nПРОВАЛЫ (' + fails.length + '):');
  fails.forEach(f => console.log(' ✗', f));
  process.exit(1);
}
console.log('\nТест наставника: подсказки и разбор ошибок работают ✔');
process.exit(0);
