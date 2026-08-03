/**
 * check-screens.mjs — проверка, что экраны действительно рендерятся
 * (а не только логика работает): дашборд, каталог, домен, курс, урок, роадмап.
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
w.SqlRunner = { run: async () => ({ result: { columns: ['x'], values: [[1]] } }), check: async () => ({ ok: true, message: 'ok' }), tableHtml: () => '<table class="sql-table"></table>', ensure: async () => {}, setSeed: () => {}, isReady: () => true };
globalThis.fetch = async (url) => {
  const clean = String(url).split('?')[0].replace(/^\.?\//, '');
  if (clean.startsWith('api/')) return { ok: true, status: 200, json: async () => ({ state: null, ok: true }) };
  const file = path.join(ROOT, clean);
  if (!fs.existsSync(file)) return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
  const body = fs.readFileSync(file, 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(body), text: async () => body };
};
w.fetch = globalThis.fetch;

/* прогресс: 3 модуля Python пройдены */
const legacyModule = { theory: true, quizBest: 100, tasks: { t1: true, t2: true, t3: true }, examBest: 85, examPerfect: false };
w.localStorage.setItem('pyquest_v1', JSON.stringify({
  xp: 340, streak: 2, start: '2026-07-27', name: 'Азиз',
  mods: { m01: structuredClone(legacyModule), m02: structuredClone(legacyModule), m03: structuredClone(legacyModule) },
  ach: [], finalBest: 0, rm: {},
}));

const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const i18n = await imp('js/core/i18n.js');
const content = await imp('js/core/content.js');
const state = await imp('js/core/state.js');
const dash = await imp('js/screens/dashboard.js');
const catalogScreen = await imp('js/screens/catalog.js');
const courseScreen = await imp('js/screens/course.js');
const misc = await imp('js/screens/misc.js');
const examScreen = await imp('js/screens/exam.js');
const auth = await imp('js/screens/auth.js');

await i18n.initI18n();
await i18n.setLang('ru');
await content.loadCatalog();
state.setState(state.migrate(JSON.parse(w.localStorage.getItem('pyquest_v1'))));

const app = w.document.getElementById('app');
const txt = () => app.textContent;

/* --- экран входа --- */
auth.renderAuth(app, 'login');
check('вход: карточка отрисована', !!app.querySelector('.auth-card'));
check('вход: поля логина и пароля', !!app.querySelector('#auth-user') && !!app.querySelector('#auth-pass'));
check('вход: две вкладки', app.querySelectorAll('.auth-tab').length === 2);

/* --- дашборд --- */
dash.renderDashboard(app);
check('дашборд: герой', !!app.querySelector('.hero'));
check('дашборд: 4 плитки статистики', app.querySelectorAll('.stat-tile').length === 4);
check('дашборд: карточки курсов текущего направления', app.querySelectorAll('.course-card').length >= 6);
check('дашборд: план на 6 недель', app.querySelectorAll('.plan-week').length === 6);
check('дашборд: 15 достижений', app.querySelectorAll('.ach').length === 15, app.querySelectorAll('.ach').length);
check('дашборд: показан XP-прогресс', !!app.querySelector('.xp-bar-wrap'));
check('дашборд: кнопка «продолжить» ведёт на курс', /#\/course\//.test(app.innerHTML));
check('дашборд: навыки отображаются', txt().includes('навык') || !!app.querySelector('.skill-chips'));

/* --- каталог --- */
catalogScreen.renderCatalog(app);
check('каталог: 16 карточек направлений', app.querySelectorAll('.domain-card').length === 16, app.querySelectorAll('.domain-card').length);
check('каталог: 9 карточек курсов', app.querySelectorAll('.course-grid .course-card').length === 9);
check('каталог: статусы честно помечены', txt().includes('В разработке'));

/* --- страница направления (визуальный путь) --- */
catalogScreen.renderDomain(app, 'data-engineering');
check('направление: заголовок', txt().includes('Data Engineering'));
check('направление: 4 стадии пути', app.querySelectorAll('.rm-stage').length === 4, app.querySelectorAll('.rm-stage').length);
check('направление: узлы курсов', app.querySelectorAll('.rm-node').length === 6);
check('направление: статус-бейджи есть у узлов', app.querySelectorAll('.rm-node .status-badge').length === 6);
check('направление: внешняя стадия честно помечена', txt().includes('вне платформы'));

catalogScreen.renderDomain(app, 'ai');
check('направление в разработке: плашка статуса', !!app.querySelector('.notice'));

/* --- страница курса --- */
await courseScreen.renderCourse(app, 'python-basics');
check('курс: заголовок и описание', txt().includes('Python'));
check('курс: 5 строк модулей', app.querySelectorAll('.mod-row').length === 5);
check('курс: пройденные модули помечены', app.querySelectorAll('.mod-row.completed').length === 3, app.querySelectorAll('.mod-row.completed').length);
check('курс: навыки курса показаны', !!app.querySelector('.skill-chips') || !!app.querySelector('.skills-row'));
check('курс: показано переиспользование в направлениях', txt().includes('направлениях'));

await courseScreen.renderCourse(app, 'python-advanced');
check('курс: финальный экзамен отдельной строкой', !!app.querySelector('.final-row'));

/* --- модуль: теория, квиз, задачи --- */
await courseScreen.renderModule(app, 'python-basics', 'pb-01', 'theory');
check('теория: карточка урока', !!app.querySelector('.theory-card'));
check('теория: 4 вкладки модуля', app.querySelectorAll('.tab').length === 4);
check('теория: навигация по урокам', !!app.querySelector('.theory-nav'));
check('теория: подсветка кода работает', !!app.querySelector('pre.code'));

await courseScreen.renderModule(app, 'python-basics', 'pb-01', 'quiz');
check('квиз: вопрос и варианты', !!app.querySelector('.quiz-q') && app.querySelectorAll('.quiz-opt').length >= 2);

await courseScreen.renderModule(app, 'python-basics', 'pb-01', 'tasks');
check('задачи: список из 3 задач', app.querySelectorAll('.task-item').length === 3);

await courseScreen.renderModule(app, 'python-basics', 'pb-01', 'tasks', 't1');
check('задача: редактор кода', !!app.querySelector('#ed'));
check('задача: кнопки запуска и проверки', !!app.querySelector('#run-btn') && !!app.querySelector('#check-btn'));

/* --- интерактивные блоки нового курса --- */
await courseScreen.renderModule(app, 'backend-intro', 'be-01', 'theory');
let guard = 12;
let foundInteractive = false;
while (guard-- > 0) {
  if (app.querySelector('.b-inter')) { foundInteractive = true; break; }
  const next = app.querySelector('#th-next');
  if (!next) break;
  next.click();
  await new Promise(r => setTimeout(r, 10));
}
check('урок: интерактивный блок отрисован', foundInteractive);

/* --- SQL-курс --- */
await courseScreen.renderModule(app, 'sql-basics', 'sb-01', 'tasks', 't1');
check('SQL-задача: редактор и кнопка «Выполнить»', !!app.querySelector('#ed') && app.textContent.includes('Выполнить'));

/* --- экзамен --- */
await examScreen.renderExam(app, 'python-basics', 'pb-01');
check('экзамен: экран старта', !!app.querySelector('.exam-intro') && txt().includes('Начать экзамен'));
examScreen.stopExam();

/* --- роадмап --- */
misc.renderRoadmap(app);
check('роадмап: секции ментора', app.querySelectorAll('.rm-section').length >= 6, app.querySelectorAll('.rm-section').length);
check('роадмап: кликабельные пункты', app.querySelectorAll('[data-rm]').length > 20);
check('роадмап: ссылка на kudvenkat', app.innerHTML.includes('PL08903FB7ACA1C2FB'));

/* --- практика --- */
await misc.renderPractice(app);
check('практика: задачи из пройденных модулей', app.querySelectorAll('.task-item').length > 0, app.querySelectorAll('.task-item').length);

/* --- оценка уровня --- */
await misc.renderAssessment(app, 'python-basics');
check('оценка уровня: экран старта', txt().includes('Начать тест'));

/* --- смена языка перерисовывает интерфейс --- */
await i18n.setLang('en');
catalogScreen.renderCatalog(app);
check('английский: каталог на английском', txt().includes('Learning paths'), txt().slice(0, 40));
await i18n.setLang('uz');
dash.renderDashboard(app);
check('узбекский: дашборд на узбекском', txt().includes('haftalik') || txt().includes('Statistika'), txt().slice(0, 60));
await i18n.setLang('ru');

if (fails.length) {
  console.log('\nПРОВАЛЫ (' + fails.length + '):');
  fails.forEach(f => console.log(' ✗', f));
  process.exit(1);
}
console.log('\nТест экранов: все экраны рендерятся ✔');
process.exit(0);
