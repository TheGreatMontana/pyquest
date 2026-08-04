/**
 * content.js — ленивая загрузка каталога и курсов.
 *
 * Каталог грузится один раз при старте (~20 КБ).
 * Курс подгружается только когда пользователь его открыл, плюс оверлей перевода
 * для текущего языка (content/courses/<id>.<lang>.json), если он существует.
 */
import { getLang } from './i18n.js';

let catalog = null;
const courseCache = new Map();      // id -> курс (с применённым оверлеем)
const overlayCache = new Map();     // id|lang -> оверлей или null

const V = () => '?v=' + window.PQ_VERSION;

export async function loadCatalog() {
  if (catalog) return catalog;
  const res = await fetch('content/catalog.json' + V());
  if (!res.ok) throw new Error('Не удалось загрузить каталог курсов');
  catalog = await res.json();
  // индексы для быстрого доступа
  catalog._domains = Object.fromEntries(catalog.domains.map(d => [d.id, d]));
  catalog._courses = Object.fromEntries(catalog.courses.map(c => [c.id, c]));
  catalog._skills = Object.fromEntries(catalog.skills.map(s => [s.id, s]));
  catalog._paths = Object.fromEntries(catalog.careerPaths.map(p => [p.id, p]));
  return catalog;
}

export function getCatalog() { return catalog; }
export function domain(id) { return catalog._domains[id]; }
export function courseMeta(id) { return catalog._courses[id]; }
export function skill(id) { return catalog._skills[id]; }
export function careerPath(id) { return catalog._paths[id]; }

/** Домены, в которых используется курс (для блока «Используется в направлениях»). */
export function domainsUsingCourse(courseId) {
  return catalog.domains.filter(d => {
    const p = d.careerPath && catalog._paths[d.careerPath];
    return p && p.stages.some(st => (st.courses || []).includes(courseId));
  });
}

/** Все курсы карьерного пути по порядку стадий. */
export function pathCourses(pathId) {
  const p = catalog._paths[pathId];
  if (!p) return [];
  const out = [];
  p.stages.forEach(st => (st.courses || []).forEach(c => { if (!out.includes(c)) out.push(c); }));
  return out;
}

/* ---------- оверлеи переводов ---------- */

async function loadOverlay(courseId, lang) {
  const key = courseId + '|' + lang;
  if (overlayCache.has(key)) return overlayCache.get(key);
  let data = null;
  if (lang !== 'ru') {
    try {
      const res = await fetch('content/courses/' + courseId + '.' + lang + '.json' + V());
      if (res.ok) data = await res.json();
    } catch (e) { /* перевода нет — покажем русский через fallback */ }
  }
  overlayCache.set(key, data);
  return data;
}

/**
 * Применяет плоский оверлей к курсу.
 * Ключ вида "pb-01.quiz.0.q" адресует поле внутри модуля; значение кладётся
 * в мультиязычное поле как { …, uz: 'перевод' }.
 */
function applyOverlay(course, overlay, lang) {
  if (!overlay) return course;
  for (const path in overlay) {
    const parts = path.split('.');
    let node = course;
    let ok = true;
    for (let i = 0; i < parts.length - 1 && ok; i++) {
      const key = parts[i];
      if (Array.isArray(node)) node = node[+key];
      else if (node && typeof node === 'object') node = node[key];
      else ok = false;
      // первый сегмент — id модуля: ищем по id, а не по индексу
      if (i === 0 && !node) {
        node = (course.modules || []).find(m => m.id === key);
        if (!node) ok = false;
      }
    }
    if (!ok || !node) continue;
    const last = parts[parts.length - 1];
    const target = Array.isArray(node) ? node[+last] : node[last];
    if (target && typeof target === 'object') target[lang] = overlay[path];
    else if (Array.isArray(node)) node[+last] = { ru: String(target || ''), [lang]: overlay[path] };
    else node[last] = { ru: String(target || ''), [lang]: overlay[path] };
  }
  return course;
}

/** Загружает курс с переводом для текущего языка. */
export async function loadCourse(courseId) {
  const lang = getLang();
  const cacheKey = courseId + '|' + lang;
  if (courseCache.has(cacheKey)) return courseCache.get(cacheKey);

  const res = await fetch('content/courses/' + courseId + '.json' + V());
  if (!res.ok) throw new Error('Курс не найден: ' + courseId);
  const course = await res.json();

  const overlay = await loadOverlay(courseId, lang);
  applyOverlay(course, overlay, lang);

  courseCache.set(cacheKey, course);
  return course;
}

/** Модуль курса по id (курс должен быть загружен). */
export function findModule(course, moduleId) {
  return (course.modules || []).find(m => m.id === moduleId);
}

/** Проекты — крупные практические работы, лениво. */
let projects = null;
export async function loadProjects() {
  if (projects) return projects;
  const res = await fetch('content/projects.json' + V());
  if (!res.ok) throw new Error('Не удалось загрузить проекты');
  const data = await res.json();
  projects = data.projects;
  return projects;
}
export function projectsLoaded() { return projects; }

/** Учебная база для SQL-тренажёра — тоже лениво. */
let sqlSeed = null;
export async function loadSqlSeed() {
  if (sqlSeed) return sqlSeed;
  const res = await fetch('content/sql/store-db.sql' + V());
  if (!res.ok) throw new Error('Не удалось загрузить учебную базу');
  sqlSeed = await res.text();
  return sqlSeed;
}
