/**
 * check-projects.mjs — режим проектов, закладки и история просмотров.
 *
 * Проверяем: этапы засчитываются, XP не начисляется дважды, проект нельзя
 * завершить с незакрытым чеклистом, закладки и история переживают перерисовку.
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

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .replace(/<script[\s\S]*?<\/script>\s*/g, '')
  .replace(/<link[^>]*fonts[^>]*>\s*/g, '');
const dom = new JSDOM(html, { url: 'https://course.azizbek-azimov.uz/', pretendToBeVisual: true });
const w = dom.window;
w.scrollTo = () => {};
globalThis.window = w;
globalThis.document = w.document;
globalThis.localStorage = w.localStorage;
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true, writable: true });
globalThis.location = w.location;
w.PQ_VERSION = 'test';
w.PyRunner = { run: async () => ({ out: 'ok', err: null, test_err: null }), ensure: async () => {}, isReady: () => true };
w.SqlRunner = { run: async () => ({ result: { columns: [], values: [] } }), check: async () => ({ ok: true }), tableHtml: () => '', ensure: async () => {}, setSeed: () => {}, isReady: () => true };
globalThis.fetch = async (u) => {
  const c = String(u).split('?')[0].replace(/^\.?\//, '');
  if (c.startsWith('api/')) return { ok: true, status: 200, json: async () => ({ state: null, ok: true }) };
  const f = path.join(ROOT, c);
  if (!fs.existsSync(f)) return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
  const b = fs.readFileSync(f, 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(b), text: async () => b };
};
w.fetch = globalThis.fetch;

const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const i18n = await imp('js/core/i18n.js');
const content = await imp('js/core/content.js');
const state = await imp('js/core/state.js');
const gam = await imp('js/core/gamification.js');
const projectsScreen = await imp('js/screens/projects.js');
const courseScreen = await imp('js/screens/course.js');
const dash = await imp('js/screens/dashboard.js');

await i18n.initI18n();
await i18n.setLang('ru');
await content.loadCatalog();
state.setState(state.freshState());

const app = w.document.getElementById('app');
const tick = () => new Promise(r => setTimeout(r, 30));

/* ---------- контент проектов ---------- */
const projects = await content.loadProjects();
check('проекты загружаются', projects.length === 5, projects.length);
check('у каждого проекта есть этапы', projects.every(p => p.milestones.length >= 4));
check('у каждого проекта есть чеклист', projects.every(p => (p.checklist.ru || []).length >= 4));
check('проекты на трёх языках', projects.every(p => ['ru', 'uz', 'en'].every(l => p.title[l] && p.summary[l])));
check('есть проект по ETL (ключевой для DE)', projects.some(p => p.id === 'etl-pipeline'));
check('есть финальный проект-портфолио', projects.some(p => p.id === 'portfolio'));

/* ---------- экран списка ---------- */
await projectsScreen.renderProjects(app);
check('экран проектов: 5 карточек', app.querySelectorAll('.project-card').length === 5);
check('экран проектов: показан XP', app.textContent.includes('XP'));
check('экран проектов: показаны технологии', app.querySelectorAll('.tech-chip').length > 0);

/* ---------- страница проекта ---------- */
await projectsScreen.renderProject(app, 'cli-toolkit');
const pr = projects.find(p => p.id === 'cli-toolkit');
check('страница проекта: этапы отрисованы', app.querySelectorAll('.milestone').length === pr.milestones.length);
check('страница проекта: чеклист отрисован', app.querySelectorAll('.check-item').length === pr.checklist.ru.length);
check('страница проекта: поле для ссылки на репозиторий', !!app.querySelector('#repo-url'));
check('кнопка завершения заблокирована в начале', app.querySelector('#finish-btn').disabled === true);

/* ---------- этапы и XP ---------- */
const xp0 = state.state().xp;
app.querySelector('[data-ms]').click();
await tick();
check('этап засчитан', !!state.state().projects['cli-toolkit'].milestones[pr.milestones[0].id]);
check('XP начислен за этап', state.state().xp === xp0 + 50, state.state().xp - xp0);

const xp1 = state.state().xp;
app.querySelector('[data-ms]').click();     // снять отметку
await tick();
app.querySelector('[data-ms]').click();     // поставить снова
await tick();
check('повторная отметка того же этапа не начисляет XP', state.state().xp === xp1, state.state().xp - xp1);

/* ---------- завершение проекта ---------- */
const st = projectsScreen.projectState('cli-toolkit');
pr.milestones.forEach(m => { st.milestones[m.id] = true; });
pr.checklist.ru.forEach((_, i) => { st.checklist[i] = true; });
await projectsScreen.renderProject(app, 'cli-toolkit');
check('кнопка завершения активна при всех отметках', app.querySelector('#finish-btn').disabled === false);

const xp2 = state.state().xp;
app.querySelector('#finish-btn').click();
await tick();
check('проект отмечен завершённым', !!state.state().projects['cli-toolkit'].completedAt);
check('XP за завершение начислен', state.state().xp === xp2 + pr.xp, state.state().xp - xp2);

/* повторное завершение не платит */
const xp3 = state.state().xp;
gam.awardProject('cli-toolkit', pr.xp);
check('повторное завершение проекта не начисляет XP', state.state().xp === xp3);

/* прогресс проекта считается верно */
const prog = projectsScreen.projectProgress(pr);
check('прогресс проекта 100%', prog.pct === 100 && prog.completed);

/* ---------- закладки ---------- */
courseScreen.initBookmarks(app);
await courseScreen.renderModule(app, 'python-basics', 'pb-01', 'theory');
const bm = app.querySelector('[data-bm]');
check('кнопка закладки есть в шапке модуля', !!bm);
bm.click();
await tick();
check('закладка добавлена', state.state().bookmarks.length === 1, state.state().bookmarks.length);
check('закладка помнит курс и модуль',
  state.state().bookmarks[0].courseId === 'python-basics' && state.state().bookmarks[0].moduleId === 'pb-01');
check('isBookmarked видит закладку', state.isBookmarked('python-basics', 'pb-01', 'theory') === true);

/* делегирование переживает перерисовку экрана */
await courseScreen.renderModule(app, 'python-basics', 'pb-01', 'quiz');
const bm2 = app.querySelector('[data-bm]');
bm2.click();
await tick();
check('закладка на другой вкладке добавляется (обработчик жив после перерисовки)',
  state.state().bookmarks.length === 2, state.state().bookmarks.length);
bm2.click();
await tick();
check('повторный клик снимает закладку', state.state().bookmarks.length === 1, state.state().bookmarks.length);

/* ---------- история просмотров ---------- */
await courseScreen.renderModule(app, 'python-basics', 'pb-02', 'theory');
await courseScreen.renderModule(app, 'sql-basics', 'sb-01', 'theory');
const recent = state.state().recent;
check('история просмотров пополняется', recent.length >= 2, recent.length);
check('последний просмотренный — первым', recent[0].moduleId === 'sb-01', recent[0].moduleId);
await courseScreen.renderModule(app, 'python-basics', 'pb-02', 'theory');
check('повторный визит поднимает урок наверх без дублей',
  state.state().recent[0].moduleId === 'pb-02' &&
  state.state().recent.filter(r => r.moduleId === 'pb-02').length === 1);

/* ---------- дашборд показывает закладки и историю ---------- */
dash.renderDashboard(app);
check('дашборд: блок «продолжить с того же места»', app.textContent.includes('Продолжить с того же места'));
check('дашборд: блок закладок', app.textContent.includes('Закладки'));
check('дашборд: ссылки на уроки из истории', app.querySelectorAll('.recent-item').length > 0);

/* ---------- языки ---------- */
await i18n.setLang('en');
await projectsScreen.renderProjects(app);
check('проекты на английском', app.textContent.includes('Projects') && app.textContent.includes('Command-line toolkit'));
await i18n.setLang('uz');
await projectsScreen.renderProject(app, 'etl-pipeline');
check('проект на узбекском', app.textContent.includes('ETL'), app.textContent.slice(0, 60));
await i18n.setLang('ru');

if (fails.length) {
  console.log('\nПРОВАЛЫ (' + fails.length + '):');
  fails.forEach(f => console.log(' ✗', f));
  process.exit(1);
}
console.log('\nТест проектов и закладок: всё работает ✔');
process.exit(0);
