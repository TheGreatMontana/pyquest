/**
 * state.js — прогресс пользователя, миграция схемы и синхронизация с сервером.
 *
 * ГЛАВНОЕ ПРАВИЛО: прогресс пользователя нельзя терять.
 *  - миграция v1 → v2 выполняется один раз и НЕ удаляет исходные данные
 *    (старый объект `mods` сохраняется в `legacyMods` как страховка);
 *  - при любой ошибке синхронизации данные остаются в localStorage;
 *  - при входе выбирается более полное из двух состояний (локальное / серверное).
 */
import { getCatalog } from './content.js';

const KEY = 'pyquest_v1';          // ключ сохранён ради обратной совместимости
const AUTH_KEY = 'pyquest_auth';
const LAST_USER_KEY = 'pyquest_last_user';
export const SCHEMA_VERSION = 2;

export function freshState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    xp: 0, streak: 0, lastDay: null, start: null, name: '',
    modules: {},        // "courseId/moduleId" -> { theory, quizBest, tasks, examBest, examPerfect, blocks }
    courses: {},        // courseId -> { started, completedAt }
    finals: {},         // courseId -> лучший % финального экзамена
    ach: [], rm: {}, langsUsed: [],
    assessments: {},    // courseId -> { level, pct, at }
    projects: {},       // projectId -> { milestones, checklist, startedAt, completedAt, repo }
    bookmarks: [],      // [{ courseId, moduleId, tab, title, at }]
    recent: [],         // недавно просмотренные уроки, максимум 8
  };
}

const RECENT_LIMIT = 8;

/* ---------- закладки и история (раздел «Прогресс пользователя») ---------- */

export function bookmarkKey(courseId, moduleId, tab) {
  return courseId + '/' + moduleId + (tab ? '/' + tab : '');
}

export function isBookmarked(courseId, moduleId, tab) {
  return (S.bookmarks || []).some(b => bookmarkKey(b.courseId, b.moduleId, b.tab) === bookmarkKey(courseId, moduleId, tab));
}

export function toggleBookmark(entry) {
  if (!S.bookmarks) S.bookmarks = [];
  const key = bookmarkKey(entry.courseId, entry.moduleId, entry.tab);
  const idx = S.bookmarks.findIndex(b => bookmarkKey(b.courseId, b.moduleId, b.tab) === key);
  if (idx >= 0) S.bookmarks.splice(idx, 1);
  else S.bookmarks.unshift(Object.assign({ at: new Date().toISOString() }, entry));
  persist();
  return idx < 0;                       // true — добавили, false — убрали
}

/** Запоминает последний открытый урок; дубликаты поднимаются наверх. */
export function noteRecent(entry) {
  if (!S.recent) S.recent = [];
  const key = bookmarkKey(entry.courseId, entry.moduleId);
  S.recent = S.recent.filter(r => bookmarkKey(r.courseId, r.moduleId) !== key);
  S.recent.unshift(Object.assign({ at: new Date().toISOString() }, entry));
  if (S.recent.length > RECENT_LIMIT) S.recent.length = RECENT_LIMIT;
  persist();
}

let S = freshState();
let AUTH = null;

/* ---------- доступ ---------- */
export function state() { return S; }
export function auth() { return AUTH; }
export function moduleKey(courseId, moduleId) { return courseId + '/' + moduleId; }

export function mod(courseId, moduleId) {
  const k = moduleKey(courseId, moduleId);
  if (!S.modules[k]) S.modules[k] = { theory: false, quizBest: 0, tasks: {}, examBest: 0, examPerfect: false, blocks: {} };
  if (!S.modules[k].blocks) S.modules[k].blocks = {};
  return S.modules[k];
}

/* ---------- миграция v1 → v2 ---------- */
export function migrate(raw) {
  const st = Object.assign(freshState(), raw || {});
  if (st.schemaVersion === SCHEMA_VERSION && st.modules && Object.keys(st.modules).length) return st;

  const cat = getCatalog();
  const map = (cat && cat.legacyMap) || {};

  if (raw && raw.mods && Object.keys(raw.mods).length) {
    st.legacyMods = JSON.parse(JSON.stringify(raw.mods));   // страховка: исходник не удаляем
    let migrated = 0;
    for (const legacyId in raw.mods) {
      const target = map[legacyId];
      if (!target) continue;                                 // неизвестный ключ — оставляем в legacyMods
      const src = raw.mods[legacyId];
      st.modules[target] = {
        theory: !!src.theory,
        quizBest: src.quizBest || 0,
        tasks: Object.assign({}, src.tasks || {}),
        examBest: src.examBest || 0,
        examPerfect: !!src.examPerfect,
        blocks: {},
      };
      migrated++;
    }
    st.migratedModules = migrated;
  }

  // финальный экзамен Python жил отдельным полем finalBest
  if (raw && raw.finalBest) {
    st.finals['python-advanced'] = raw.finalBest;
    st.legacyFinalBest = raw.finalBest;
  }

  st.schemaVersion = SCHEMA_VERSION;
  return st;
}

/** Насколько состояние «богатое» — для выбора между локальным и серверным. */
export function stateScore(s) {
  if (!s) return -1;
  const mods = s.modules ? Object.keys(s.modules).length : 0;
  const legacy = s.mods ? Object.keys(s.mods).length : 0;
  return (s.xp || 0) * 10 + Math.max(mods, legacy);
}

/* ---------- загрузка и сохранение ---------- */
export function loadLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch (e) { return null; }
}

export function setState(next) {
  S = next;
  if (!S.start) S.start = today();
  persist();
}

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('localStorage переполнен', e); }
  scheduleSync();
}

export function clearLocal() {
  localStorage.removeItem(KEY);
  Object.keys(localStorage)
    .filter(k => k.indexOf('pyquest_code_') === 0)
    .forEach(k => localStorage.removeItem(k));
  S = freshState();
}

/* ---------- даты и стрик ---------- */
export function today() { return new Date().toISOString().slice(0, 10); }

export function touchStreak() {
  const t = today();
  if (S.lastDay === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  S.streak = (S.lastDay === yesterday) ? (S.streak || 0) + 1 : 1;
  S.lastDay = t;
}

/* ---------- авторизация ---------- */
export function loadAuth() {
  try { AUTH = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch (e) { AUTH = null; }
  return AUTH;
}
export function setAuth(a) {
  AUTH = a;
  if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  else localStorage.removeItem(AUTH_KEY);
}
export function lastUser() { return localStorage.getItem(LAST_USER_KEY); }
export function setLastUser(u) { localStorage.setItem(LAST_USER_KEY, u); }

/* ---------- API ---------- */
export async function api(path, method, body, keepalive) {
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH && AUTH.token) headers['Authorization'] = 'Bearer ' + AUTH.token;
  const res = await fetch('/api' + path, {
    method: method || 'GET', headers,
    body: body ? JSON.stringify(body) : undefined,
    keepalive: !!keepalive,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* пустой ответ */ }
  if (res.status === 401 && AUTH && path !== '/login' && path !== '/register') {
    const err = new Error('401');
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Сервер недоступен (' + res.status + ')');
  return data;
}

/* ---------- синхронизация ---------- */
let syncTimer = null, dirty = false, busy = false;
const syncListeners = [];
export function onSyncError(fn) { syncListeners.push(fn); }

function scheduleSync() {
  if (!AUTH) return;
  dirty = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { pushState().catch(() => {}); }, 1500);
}

export async function pushState(keepalive) {
  if (!AUTH || !dirty || busy) return;
  busy = true;
  try {
    await api('/state', 'PUT', { state: S }, keepalive);
    dirty = false;
  } catch (e) {
    if (e.unauthorized) syncListeners.forEach(fn => fn(e));
    throw e;
  } finally {
    busy = false;
  }
}

export function initSync() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dirty) pushState(true).catch(() => {});
  });
  setInterval(() => { if (dirty) pushState().catch(() => {}); }, 30000);
}
