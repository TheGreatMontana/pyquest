/**
 * i18n.js — язык интерфейса и мультиязычные поля контента.
 *
 * Две сущности:
 *   t(key, params)  — строка интерфейса из словаря content/i18n/ui.<lang>.json
 *   tr(field)       — мультиязычное поле контента вида { ru, uz, en }
 *
 * Fallback-цепочка гарантирует, что пользователь никогда не увидит пустой экран:
 * выбранный язык → русский → английский → первое непустое значение.
 */
const LANGS = ['ru', 'uz', 'en'];
const FALLBACK = ['ru', 'en'];
const STORE_KEY = 'pyquest_lang';

let current = 'ru';
let dict = {};
const loaded = {};
const listeners = [];

function detect() {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved && LANGS.includes(saved)) return saved;
  const nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  if (LANGS.includes(nav)) return nav;
  return 'ru';
}

async function loadDict(lang) {
  if (loaded[lang]) return loaded[lang];
  try {
    const res = await fetch('content/i18n/ui.' + lang + '.json?v=' + window.PQ_VERSION);
    if (!res.ok) throw new Error('dict ' + res.status);
    loaded[lang] = await res.json();
  } catch (e) {
    console.warn('[i18n] не удалось загрузить словарь', lang, e);
    loaded[lang] = {};
  }
  return loaded[lang];
}

/** Инициализация: загружает выбранный язык и русский (как базу для fallback). */
export async function initI18n() {
  current = detect();
  await Promise.all([loadDict(current), current === 'ru' ? Promise.resolve() : loadDict('ru')]);
  dict = loaded[current];
  document.documentElement.lang = current;
  return current;
}

export function getLang() { return current; }
export function languages() { return LANGS.slice(); }

/** Смена языка: перезагружает словарь и уведомляет подписчиков (перерисовка экрана). */
export async function setLang(lang) {
  if (!LANGS.includes(lang) || lang === current) return;
  await loadDict(lang);
  current = lang;
  dict = loaded[lang];
  localStorage.setItem(STORE_KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
}

export function onLangChange(fn) { listeners.push(fn); }

/** Строка интерфейса. Подстановка: t('exam.best', { pct: 80 }) */
export function t(key, params) {
  let s = dict[key];
  if (s === undefined) s = (loaded.ru || {})[key];
  if (s === undefined) s = key;               // видно при разработке, UI не ломается
  if (params) {
    for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
  }
  return s;
}

/** Мультиязычное поле контента: tr({ ru: '…', en: '…' }) */
/**
 * Число со словом в правильной форме: «1 модуль», «2 модуля», «5 модулей».
 * В словаре лежат ключи <key>.one / .few / .many; русский берёт все три,
 * английский — one и many, узбекский обходится одной формой.
 */
export function plural(n, key) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  let form;
  if (getLang() === 'ru') {
    if (abs > 10 && abs < 20) form = 'many';
    else if (last === 1) form = 'one';
    else if (last >= 2 && last <= 4) form = 'few';
    else form = 'many';
  } else {
    form = n === 1 ? 'one' : 'many';
  }
  let word = dict[key + '.' + form];
  if (word === undefined) word = dict[key + '.many'];           // узбекский: одна форма
  if (word === undefined) word = (loaded.ru || {})[key + '.' + form];
  if (word === undefined) word = t(key);                        // словарь ещё не пополнен
  return n + ' ' + word;
}

export function tr(field) {
  if (field === null || field === undefined) return '';
  if (typeof field === 'string') return field;      // старый формат — не ломаемся
  if (field[current]) return field[current];
  for (const l of FALLBACK) if (field[l]) return field[l];
  for (const l in field) if (field[l]) return field[l];
  return '';
}

/** true, если поле есть, но не переведено на текущий язык (для честной пометки). */
export function isFallback(field) {
  return !!(field && typeof field === 'object' && !field[current]);
}

/** Локализованная дата. */
export function formatDate(date) {
  const locale = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-US' }[current] || 'ru-RU';
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}
