/**
 * gamification.js — XP, ранги, достижения, стрик.
 *
 * Защита от накрутки: XP начисляется только за ПЕРВОЕ достижение результата.
 * Повторное прохождение уже пройденного даёт XP лишь на разницу с прошлым лучшим
 * результатом — обновление страницы или повтор упражнения ничего не добавляют.
 */
import { getCatalog } from './content.js';
import { state, persist, touchStreak, mod } from './state.js';
import { tr, t } from './i18n.js';
import { courseStatus, STATUS, stats } from './graph.js';

const listeners = { xp: [], achievement: [] };
export function onXp(fn) { listeners.xp.push(fn); }
export function onAchievement(fn) { listeners.achievement.push(fn); }

export function rewards() { return getCatalog().xpRewards; }

export function rank() {
  const S = state();
  const ranks = getCatalog().ranks;
  let r = ranks[0];
  for (const x of ranks) if (S.xp >= x.xp) r = x;
  return r;
}
export function nextRank() {
  const S = state();
  return getCatalog().ranks.find(r => r.xp > S.xp) || null;
}

/** Единственная точка начисления XP. */
export function addXp(amount, reason) {
  if (!amount || amount <= 0) return 0;
  const S = state();
  S.xp += amount;
  touchStreak();
  persist();
  listeners.xp.forEach(fn => fn(amount, reason));
  checkAchievements();
  return amount;
}

/* ---------- начисления за конкретные события ---------- */

export function awardTheory(courseId, moduleId) {
  const m = mod(courseId, moduleId);
  if (m.theory) return 0;                       // повторно не платим
  m.theory = true;
  return addXp(rewards().lesson, 'lesson');
}

export function awardBlock(courseId, moduleId, blockKey) {
  const m = mod(courseId, moduleId);
  if (m.blocks[blockKey]) return 0;             // интерактивный блок засчитывается один раз
  m.blocks[blockKey] = true;
  return addXp(rewards().interactiveBlock, 'block');
}

export function awardQuiz(courseId, moduleId, correct, total) {
  const m = mod(courseId, moduleId);
  const pct = Math.round((correct / total) * 100);
  const prevCorrect = Math.round((m.quizBest / 100) * total);
  const delta = Math.max(0, correct - prevCorrect);   // платим только за улучшение
  if (pct > m.quizBest) m.quizBest = pct;
  persist();
  return delta ? addXp(delta * rewards().quizAnswer, 'quiz') : 0;
}

export function awardTask(courseId, moduleId, taskId) {
  const m = mod(courseId, moduleId);
  if (m.tasks[taskId]) return 0;
  m.tasks[taskId] = true;
  return addXp(rewards().task, 'task');
}

export function awardExam(courseId, moduleId, pct) {
  const m = mod(courseId, moduleId);
  let gained = 0;
  const wasPassed = m.examBest >= 70;
  if (pct > m.examBest) m.examBest = pct;
  if (pct >= 70 && !wasPassed) gained += rewards().examPass;
  if (pct === 100 && !m.examPerfect) { m.examPerfect = true; gained += rewards().examPerfect; }
  persist();
  const total = gained ? addXp(gained, 'exam') : 0;
  if (pct >= 70) checkCourseComplete(courseId);
  return total;
}

export function awardFinal(courseId, pct) {
  const S = state();
  const prev = S.finals[courseId] || 0;
  const wasPassed = prev >= 70;
  if (pct > prev) S.finals[courseId] = pct;
  persist();
  if (pct >= 70 && !wasPassed) {
    const x = addXp(rewards().finalPass, 'final');
    checkCourseComplete(courseId);
    return x;
  }
  return 0;
}

function checkCourseComplete(courseId) {
  const S = state();
  if (!S.courses[courseId]) S.courses[courseId] = {};
  if (S.courses[courseId].completedAt) return;
  if (courseStatus(courseId).status === STATUS.COMPLETED) {
    S.courses[courseId].completedAt = new Date().toISOString();
    addXp(rewards().courseComplete, 'course');
  }
}

/** Отметка языка — питает достижение «Полиглот». */
export function noteLanguage(lang) {
  const S = state();
  if (!S.langsUsed) S.langsUsed = [];
  if (!S.langsUsed.includes(lang)) { S.langsUsed.push(lang); persist(); checkAchievements(); }
}

/* ---------- достижения ---------- */

function solvedTasks(filter) {
  const S = state();
  let n = 0;
  for (const key in S.modules) {
    if (filter && key.indexOf(filter) !== 0) continue;
    n += Object.keys(S.modules[key].tasks || {}).length;
  }
  return n;
}

function coursesDone(ids) {
  return ids.every(id => courseStatus(id).status === STATUS.COMPLETED);
}

export function checkAchievements() {
  const S = state();
  const st = stats();
  const cat = getCatalog();
  const anyExam = Object.values(S.modules).some(m => m.examBest >= 70);
  const cond = {
    'first-code': solvedTasks() >= 1,
    'quiz-perfect': Object.values(S.modules).some(m => m.quizBest >= 100),
    'boss-1': anyExam,
    'streak-3': (S.streak || 0) >= 3,
    'streak-7': (S.streak || 0) >= 7,
    'sql-first': solvedTasks('sql-') >= 1,
    'half-way': st.lessons >= 10,
    'exam-perfect': Object.values(S.modules).some(m => m.examPerfect),
    'xp-1000': S.xp >= 1000,
    'all-tasks': solvedTasks() >= 30,
    'course-python': coursesDone(['python-basics', 'python-intermediate', 'python-advanced']),
    'course-sql': coursesDone(['sql-basics', 'sql-advanced']),
    'course-algo': coursesDone(['algorithms']),
    'polyglot': (S.langsUsed || []).length >= 2,
    'career-de': coursesDone(['python-basics', 'python-intermediate', 'python-advanced', 'sql-basics', 'sql-advanced', 'algorithms']),
  };
  if (!S.ach) S.ach = [];
  for (const a of cat.achievements) {
    if (cond[a.id] && !S.ach.includes(a.id)) {
      S.ach.push(a.id);
      persist();
      listeners.achievement.forEach(fn => fn(a));
    }
  }
}
