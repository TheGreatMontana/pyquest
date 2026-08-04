/**
 * check-ui.mjs — интеграционный тест платформы.
 *
 * Использует НАСТОЯЩИЕ ES-модули приложения (не имитацию), подставляя браузерные
 * API из jsdom. Главное, что проверяем: прогресс старой версии не теряется,
 * граф пререквизитов считает статусы верно, языки работают, XP не накручивается.
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
  else fails.push(name + (extra !== undefined ? ' | получено: ' + extra : ''));
}

/* ---------- браузерное окружение ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .replace(/<script[\s\S]*?<\/script>\s*/g, '')
  .replace(/<link[^>]*fonts[^>]*>\s*/g, '');
const dom = new JSDOM(html, { url: 'https://course.azizbek-azimov.uz/', pretendToBeVisual: true });
const w = dom.window;
w.scrollTo = () => {};

let SERVER_STATE = null;

globalThis.window = w;
globalThis.document = w.document;
globalThis.localStorage = w.localStorage;
// navigator в Node только для чтения — подменяем через defineProperty
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true, writable: true });
globalThis.location = w.location;
globalThis.Event = w.Event;
globalThis.PQ_VERSION = 'test';
w.PQ_VERSION = 'test';
w.PyRunner = { run: async () => ({ out: 'ok', err: null, test_err: null }), ensure: async () => {}, isReady: () => true };
w.SqlRunner = { run: async () => ({ result: { columns: ['x'], values: [[1]] } }), check: async () => ({ ok: true, message: 'ok' }), tableHtml: () => '<table></table>', ensure: async () => {}, setSeed: () => {}, isReady: () => true };

globalThis.fetch = async (url) => {
  const clean = String(url).split('?')[0].replace(/^\.?\//, '');
  if (clean.startsWith('api/')) {
    const p = '/' + clean.slice(4);
    if (p.startsWith('/state')) return { ok: true, status: 200, json: async () => ({ state: SERVER_STATE }) };
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  }
  const file = path.join(ROOT, clean);
  if (!fs.existsSync(file)) return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
  const body = fs.readFileSync(file, 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(body), text: async () => body };
};
w.fetch = globalThis.fetch;

/* ---------- легаси-прогресс: то, что реально было у пользователя ---------- */
const legacyModule = { theory: true, quizBest: 100, tasks: { t1: true, t2: true, t3: true }, examBest: 85, examPerfect: false };
const LEGACY = {
  xp: 340, streak: 2, lastDay: null, start: '2026-07-27', name: 'Азиз',
  mods: {
    m01: structuredClone(legacyModule),
    m02: structuredClone(legacyModule),
    m03: structuredClone(legacyModule),
  },
  ach: ['first-code'], finalBest: 0, rm: { pandas: true },
};
w.localStorage.setItem('pyquest_v1', JSON.stringify(LEGACY));

/* ---------- импорт настоящих модулей приложения ---------- */
const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const i18n = await imp('js/core/i18n.js');
const content = await imp('js/core/content.js');
const state = await imp('js/core/state.js');
const graph = await imp('js/core/graph.js');
const gam = await imp('js/core/gamification.js');

/* ---------- i18n ---------- */
await i18n.initI18n();
// jsdom сообщает navigator.language = en-US, поэтому автоопределение даёт en — это верное поведение
check('i18n: язык определён из браузера', ['ru', 'uz', 'en'].includes(i18n.getLang()), i18n.getLang());
await i18n.setLang('ru');
check('i18n: строка интерфейса (ru)', i18n.t('nav.map') === 'Карта', i18n.t('nav.map'));
check('i18n: выбор языка сохраняется', w.localStorage.getItem('pyquest_lang') === 'ru');
await i18n.setLang('uz');
check('i18n: переключение на узбекский', i18n.t('nav.map') === 'Xarita', i18n.t('nav.map'));
await i18n.setLang('en');
check('i18n: переключение на английский', i18n.t('nav.map') === 'Map', i18n.t('nav.map'));
check('i18n: подстановка параметров', i18n.t('exam.best', { pct: 85 }).includes('85'));
check('i18n: fallback непереведённого поля', i18n.tr({ ru: 'Только русский' }) === 'Только русский');
check('i18n: isFallback честно сообщает', i18n.isFallback({ ru: 'x' }) === true);
await i18n.setLang('ru');

/* ---------- каталог ---------- */
const cat = await content.loadCatalog();
check('каталог: 16 направлений', cat.domains.length === 16, cat.domains.length);
check('каталог: 18 курсов', cat.courses.length === 18, cat.courses.length);
check('каталог: legacyMap на 21 запись', Object.keys(cat.legacyMap).length === 21);
check('каталог: Data Engineering — полный статус', content.domain('data-engineering').status === 'full');
check('каталог: python-basics переиспользуется в 6 путях', content.domainsUsingCourse('python-basics').length === 6, content.domainsUsingCourse('python-basics').length);

/* ---------- МИГРАЦИЯ ПРОГРЕССА (критично) ---------- */
const migrated = state.migrate(LEGACY);
check('миграция: XP сохранён', migrated.xp === 340, migrated.xp);
check('миграция: стрик сохранён', migrated.streak === 2);
check('миграция: имя сохранено', migrated.name === 'Азиз');
check('миграция: дата старта сохранена', migrated.start === '2026-07-27');
check('миграция: достижения сохранены', migrated.ach.includes('first-code'));
check('миграция: чеклист роадмапа сохранён', migrated.rm.pandas === true);
check('миграция: перенесено 3 модуля', migrated.migratedModules === 3, migrated.migratedModules);
check('миграция: m01 → python-basics/pb-01', !!migrated.modules['python-basics/pb-01']);
check('миграция: m02 → python-basics/pb-02', !!migrated.modules['python-basics/pb-02']);
check('миграция: m03 → python-basics/pb-03', !!migrated.modules['python-basics/pb-03']);
const m1 = migrated.modules['python-basics/pb-01'];
check('миграция: детали модуля целы',
  m1.theory === true && m1.quizBest === 100 && m1.examBest === 85 && Object.keys(m1.tasks).length === 3);
check('миграция: исходные данные сохранены как страховка',
  !!migrated.legacyMods && Object.keys(migrated.legacyMods).length === 3);
check('миграция: версия схемы обновлена', migrated.schemaVersion === 2);
check('миграция: идемпотентна (повтор не портит)', state.migrate(migrated).xp === 340 && Object.keys(state.migrate(migrated).modules).length === 3);

/* ---------- граф пререквизитов ---------- */
state.setState(migrated);
const pb = graph.courseProgress('python-basics');
check('граф: прогресс курса 3/5', pb.done === 3 && pb.total === 5, pb.done + '/' + pb.total);
check('граф: статус курса «в процессе»', graph.courseStatus('python-basics').status === 'in-progress');
check('граф: sql-basics доступен сразу', graph.courseStatus('sql-basics').status === 'available');
const inter = graph.courseStatus('python-intermediate');
check('граф: python-intermediate заблокирован', inter.status === 'locked' && inter.missing.length > 0);
check('граф: назван курс-источник недостающего навыка', (inter.missingCourses || []).some(c => c.id === 'python-basics'));
check('граф: algorithms требует python-functions', graph.courseStatus('algorithms').missing.includes('python-functions'));
check('граф: рекомендован следующий шаг', graph.nextRecommended('de-path') === 'python-basics', graph.nextRecommended('de-path'));
check('граф: 85% не считается слабым местом', graph.weakSpots().length === 0, graph.weakSpots().length);
state.mod('python-basics', 'pb-02').examBest = 72;          // реально слабый результат
const weak = graph.weakSpots(3);
check('граф: слабый результат попадает в диагностику', weak.length === 1 && weak[0].moduleId === 'pb-02', JSON.stringify(weak.map(x => x.moduleId)));
state.mod('python-basics', 'pb-02').examBest = 85;          // возвращаем как было
const st = graph.stats();
check('граф: статистика уроков/задач/экзаменов', st.lessons === 3 && st.tasks === 9 && st.exams === 3,
  `${st.lessons}/${st.tasks}/${st.exams}`);
// 7 курсов: Python ×3, SQL ×2, алгоритмы, инструменты DE (4-я стадия)
check('граф: путь DE считает прогресс', graph.pathProgress('de-path').total === 7, graph.pathProgress('de-path').total);

/* ---------- курсы и переводы ---------- */
const course = await content.loadCourse('python-basics');
check('курс: 5 модулей', course.modules.length === 5);
check('курс: у модуля есть уроки', course.modules[0].lessons.length === 5);
check('курс: legacyId сохранён для миграции', course.modules[0].legacyId === 'm01');
check('курс: русский заголовок на месте', i18n.tr(course.modules[0].title).includes('установка'));
check('курс: задачи на месте', course.modules[0].tasks.length === 3);
check('курс: экзамен на месте', course.modules[0].exam.questions.length > 0);
check('курс: финальный экзамен у python-advanced', !!(await content.loadCourse('python-advanced')).finalExam);

await i18n.setLang('uz');
const cUz = await content.loadCourse('python-basics');
check('перевод uz: заголовок модуля', i18n.tr(cUz.modules[0].title) === "Boshlanish: Python o'rnatish", i18n.tr(cUz.modules[0].title));
check('перевод uz: заголовок урока', i18n.tr(cUz.modules[0].lessons[0].title).includes('Python nima'));
check('перевод uz: заголовок задачи', i18n.tr(cUz.modules[0].tasks[0].title) === 'Salom, Python!', i18n.tr(cUz.modules[0].tasks[0].title));
check('перевод uz: теория падает на русский (fallback)', i18n.tr(cUz.modules[0].lessons[0].blocks[0].html).includes('<p>'));
await i18n.setLang('en');
const cEn = await content.loadCourse('python-basics');
check('перевод en: заголовок модуля', i18n.tr(cEn.modules[0].title) === 'Getting started: installing Python', i18n.tr(cEn.modules[0].title));
check('перевод en: заголовок задачи', i18n.tr(cEn.modules[0].tasks[0].title) === 'Hello, Python!');
await i18n.setLang('ru');

/* ---------- геймификация: защита от накрутки ---------- */
const xpBefore = state.state().xp;
gam.awardTheory('python-basics', 'pb-01');
check('XP: повтор пройденной теории не начисляет', state.state().xp === xpBefore, state.state().xp - xpBefore);
const gainedTheory = gam.awardTheory('python-basics', 'pb-04');
check('XP: новая теория начисляет', gainedTheory === cat.xpRewards.lesson, gainedTheory);
const b1 = gam.awardBlock('python-basics', 'pb-04', 'l1:3');
const b2 = gam.awardBlock('python-basics', 'pb-04', 'l1:3');
check('XP: интерактивный блок засчитывается один раз', b1 > 0 && b2 === 0, `${b1}/${b2}`);
check('XP: решённая задача повторно не платит', gam.awardTask('python-basics', 'pb-01', 't1') === 0);
check('XP: новая задача платит', gam.awardTask('python-basics', 'pb-04', 't1') === cat.xpRewards.task);
check('XP: квиз хуже прошлого не платит', gam.awardQuiz('python-basics', 'pb-01', 5, 10) === 0);
check('XP: лучший результат квиза не ухудшился', state.state().modules['python-basics/pb-01'].quizBest === 100);
check('XP: экзамен, сданный ранее, повторно не платит', gam.awardExam('python-basics', 'pb-01', 80) === 0);
check('ранг рассчитывается', !!gam.rank().title);

/* ---------- новые курсы ---------- */
const INTERACTIVE = ['predict', 'findbug', 'match', 'order', 'checkpoint'];
for (const id of ['backend-intro', 'analytics-intro', 'security-intro']) {
  const c = await content.loadCourse(id);
  check(`курс ${id}: загружается`, c.modules.length >= 1);
  const blocks = c.modules[0].lessons.flatMap(l => l.blocks);
  check(`курс ${id}: есть интерактивные блоки`, blocks.some(b => INTERACTIVE.includes(b.type)));
  check(`курс ${id}: 3 языка в заголовке`, ['ru', 'uz', 'en'].every(l => c.modules[0].title[l]));
  check(`курс ${id}: есть задачи и экзамен`, c.modules[0].tasks.length >= 3 && !!c.modules[0].exam);
}

/* ---------- итог ---------- */
if (fails.length) {
  console.log('\nПРОВАЛЫ (' + fails.length + '):');
  fails.forEach(f => console.log(' ✗', f));
  process.exit(1);
}
console.log('\nИнтеграционный тест платформы: всё работает ✔');
process.exit(0);
