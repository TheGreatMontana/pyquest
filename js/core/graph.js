/**
 * graph.js — граф навыков и пререквизитов.
 *
 * Статусы курсов вычисляются, а не хранятся: единственный источник правды — прогресс.
 * Пререквизит здесь — рекомендация с объяснением, а не глухая стена: заблокированный
 * курс можно открыть и посмотреть, платформа лишь честно предупреждает, чего не хватает.
 */
import { getCatalog, courseMeta, pathCourses, skill } from './content.js';
import { state, moduleKey } from './state.js';

export const STATUS = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in-progress',
  AVAILABLE: 'available',
  LOCKED: 'locked',
};

/** Все навыки, полученные пользователем (курс засчитывает навыки после завершения). */
export function earnedSkills() {
  const cat = getCatalog();
  const out = new Set();
  cat.courses.forEach(c => {
    if (courseProgress(c.id).done === courseProgress(c.id).total && courseProgress(c.id).total > 0) {
      (c.grants || []).forEach(s => out.add(s));
    }
  });
  return out;
}

/** Прогресс курса по количеству завершённых модулей (без загрузки самого курса). */
export function courseProgress(courseId) {
  const meta = courseMeta(courseId);
  const S = state();
  if (!meta) return { done: 0, total: 0, pct: 0, started: false };

  // модули курса известны из legacyIds (для мигрированных) либо из уже виденных ключей
  const prefix = courseId + '/';
  const keys = Object.keys(S.modules).filter(k => k.indexOf(prefix) === 0 && !k.endsWith('/final'));
  const total = meta.moduleCount || (meta.legacyIds || []).filter(id => id !== 'final').length || keys.length;

  let done = 0, started = false;
  keys.forEach(k => {
    const m = S.modules[k];
    if (m.theory || m.quizBest || Object.keys(m.tasks || {}).length || m.examBest) started = true;
    if (isModuleComplete(m)) done++;
  });
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, started };
}

export function isModuleComplete(m) {
  if (!m) return false;
  return !!m.theory && m.quizBest >= 70 && m.examBest >= 70;
}

/** Статус курса + чего не хватает. */
export function courseStatus(courseId) {
  const meta = courseMeta(courseId);
  if (!meta) return { status: STATUS.LOCKED, missing: [] };
  const p = courseProgress(courseId);
  if (p.total > 0 && p.done === p.total) return { status: STATUS.COMPLETED, missing: [], progress: p };
  if (p.started) return { status: STATUS.IN_PROGRESS, missing: [], progress: p };

  const have = earnedSkills();
  const missing = (meta.requires || []).filter(s => !have.has(s));
  return {
    status: missing.length ? STATUS.LOCKED : STATUS.AVAILABLE,
    missing,
    missingCourses: missing.map(s => courseGranting(s)).filter(Boolean),
    progress: p,
  };
}

/** Какой курс даёт указанный навык (для подсказки «сначала пройди…»). */
export function courseGranting(skillId) {
  return getCatalog().courses.find(c => (c.grants || []).includes(skillId));
}

/** Следующий рекомендуемый курс: первый незавершённый доступный в пути (или вообще). */
export function nextRecommended(pathId) {
  const ids = pathId ? pathCourses(pathId) : getCatalog().courses.map(c => c.id);
  let fallback = null;
  for (const id of ids) {
    const st = courseStatus(id);
    if (st.status === STATUS.IN_PROGRESS) return id;          // сначала то, что начато
    if (st.status === STATUS.AVAILABLE && !fallback) fallback = id;
  }
  return fallback;
}

/** Прогресс всего карьерного пути. */
export function pathProgress(pathId) {
  const ids = pathCourses(pathId);
  if (!ids.length) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  ids.forEach(id => { if (courseStatus(id).status === STATUS.COMPLETED) done++; });
  return { done, total: ids.length, pct: Math.round((done / ids.length) * 100) };
}

/**
 * Слабые места: модули, где квиз или экзамен сдан слабо (70–84%) либо решены не все задачи.
 * Питает блок «Стоит повторить» на дашборде — это диагностика, а не украшение.
 */
export function weakSpots(limit) {
  const S = state();
  const out = [];
  for (const key in S.modules) {
    const m = S.modules[key];
    if (key.endsWith('/final')) continue;
    const reasons = [];
    if (m.quizBest && m.quizBest < 85) reasons.push({ kind: 'quiz', pct: m.quizBest });
    if (m.examBest && m.examBest < 85) reasons.push({ kind: 'exam', pct: m.examBest });
    if (reasons.length) {
      const [courseId, moduleId] = key.split('/');
      out.push({ courseId, moduleId, key, reasons, score: Math.min(...reasons.map(r => r.pct)) });
    }
  }
  out.sort((a, b) => a.score - b.score);
  return limit ? out.slice(0, limit) : out;
}

/** Сводная статистика для дашборда. */
export function stats() {
  const S = state();
  let lessons = 0, tasks = 0, exams = 0, courses = 0;
  for (const key in S.modules) {
    const m = S.modules[key];
    if (m.theory) lessons++;
    tasks += Object.keys(m.tasks || {}).length;
    if (m.examBest >= 70) exams++;
  }
  getCatalog().courses.forEach(c => {
    if (courseStatus(c.id).status === STATUS.COMPLETED) courses++;
  });
  return { lessons, tasks, exams, courses };
}

/** Навыки пользователя с названиями — для дашборда. */
export function skillList() {
  return [...earnedSkills()].map(id => skill(id)).filter(Boolean);
}
