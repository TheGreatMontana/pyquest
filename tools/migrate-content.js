/**
 * migrate-content.js — конвертация legacy-контента (data/*.js) в content/courses/*.json
 *
 * ЧТЕНИЕ: data/*.js (не изменяются)
 * ЗАПИСЬ: content/courses/*.json, content/sql/store-db.sql
 *
 * Принципы:
 *  - ни один урок, вопрос или задача не теряется;
 *  - текстовые поля оборачиваются в мультиязычные { ru: … } (uz/en живут в оверлеях);
 *  - код (run/sql/tests/starter/solution) НЕ переводится и остаётся как есть;
 *  - каждый модуль хранит legacyId — по нему мигрирует прогресс пользователей.
 *
 * Запуск: node tools/migrate-content.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const OUT_COURSES = path.join(ROOT, 'content', 'courses');
const OUT_SQL = path.join(ROOT, 'content', 'sql');

/* Разбиение legacy-модулей на переиспользуемые курсы */
const COURSE_MAP = [
  { id: 'python-basics', legacy: ['m01', 'm02', 'm03', 'm04', 'm05'] },
  { id: 'python-intermediate', legacy: ['m06', 'm07', 'm08'] },
  { id: 'python-advanced', legacy: ['m09', 'm10'], final: 'final' },
  { id: 'sql-basics', legacy: ['s01', 's02', 's03'] },
  { id: 'sql-advanced', legacy: ['s04', 's05', 's06'] },
  { id: 'algorithms', legacy: ['a01', 'a02', 'a03', 'a04'] },
];

/* Префиксы id модулей внутри курса */
const PREFIX = {
  'python-basics': 'pb', 'python-intermediate': 'pi', 'python-advanced': 'pa',
  'sql-basics': 'sb', 'sql-advanced': 'sa', 'algorithms': 'alg',
};

/* ---------- загрузка legacy-данных в песочнице ---------- */
function loadLegacy() {
  // В браузере data/*.js пишут в window.*; в Node делаем window === global,
  // тогда `window.COURSE_DATA = {}` создаёт настоящую глобальную переменную.
  global.window = global;
  const files = ['course.js', 'sqldb.js', 'm01.js', 'm02.js', 'm03.js', 'm04.js', 'm05.js',
    'm06.js', 'm07.js', 'm08.js', 'm09.js', 'm10.js', 'final.js',
    's01.js', 's02.js', 's03.js', 's04.js', 's05.js', 's06.js',
    'a01.js', 'a02.js', 'a03.js', 'a04.js'];
  for (const f of files) {
    const code = fs.readFileSync(path.join(DATA, f), 'utf8');
    (0, eval)(code);
  }
  return { COURSE: global.COURSE, DATA: global.COURSE_DATA, SEED: global.SQL_SEED };
}

/* ---------- мультиязычная обёртка ---------- */
const ml = (ru) => (ru === undefined || ru === null ? undefined : { ru: String(ru) });

/* ---------- конвертация блоков теории ---------- */
function convertBlocks(blocks) {
  return blocks.map(b => {
    if (typeof b === 'string') return { type: 'text', html: ml(b) };
    if (b.code) return { type: 'code', lang: 'python', code: b.code };
    if (b.sql) return { type: 'code', lang: 'sql', code: b.sql };
    if (b.run) return { type: 'run', lang: 'python', code: b.run };
    if (b.sqlrun) return { type: 'sqlrun', lang: 'sql', code: b.sqlrun };
    return { type: 'text', html: ml(JSON.stringify(b)) };
  });
}

function convertLessons(theory) {
  return theory.map((card, i) => ({
    id: 'l' + (i + 1),
    title: ml(card.title),
    blocks: convertBlocks(card.blocks),
  }));
}

function convertQuiz(quiz) {
  return (quiz || []).map(q => {
    const out = { q: ml(q.q), options: q.options.map(o => ml(o)), a: q.a };
    if (q.code) out.code = q.code;
    if (q.broken) out.broken = true;
    if (q.explain) out.explain = ml(q.explain);
    return out;
  });
}

function convertTask(t, withId) {
  const out = {};
  if (withId) out.id = t.id;
  out.title = ml(t.title);
  if (t.brief) out.brief = ml(t.brief);
  out.desc = ml(t.desc);
  out.starter = t.starter === undefined ? '' : t.starter;
  if (t.hint) out.hint = ml(t.hint);
  if (t.sql) {
    out.kind = 'sql';
    out.solution = t.solution;
    if (t.checkQuery) out.checkQuery = t.checkQuery;
    if (t.orderMatters) out.orderMatters = true;
  } else {
    out.kind = 'python';
    out.tests = t.tests;
    if (t.stdin) out.stdin = t.stdin;
  }
  return out;
}

function convertExam(exam) {
  const out = { time: exam.time, questions: convertQuiz(exam.questions) };
  const tasks = exam.tasks || (exam.task ? [exam.task] : []);
  if (tasks.length) out.tasks = tasks.map(t => convertTask(t, false));
  return out;
}

/* ---------- сборка курса ---------- */
function buildCourse(spec, legacyData, courseMeta) {
  const prefix = PREFIX[spec.id];
  const modules = spec.legacy.map((legacyId, idx) => {
    const d = legacyData.DATA[legacyId];
    const meta = legacyData.COURSE.modules.find(m => m.id === legacyId);
    if (!d || !meta) throw new Error('Не найден legacy-модуль: ' + legacyId);
    const mod = {
      id: prefix + '-' + String(idx + 1).padStart(2, '0'),
      legacyId,
      title: ml(meta.title),
      tagline: ml(meta.tagline),
      lessons: convertLessons(d.theory),
      quiz: convertQuiz(d.quiz),
      tasks: d.tasks.map(t => convertTask(t, true)),
      exam: convertExam(d.exam),
    };
    if (d.sqlModule) mod.sqlModule = true;
    return mod;
  });

  const course = { id: spec.id, schema: 2, modules };
  if (spec.final) {
    const f = legacyData.DATA[spec.final];
    course.finalExam = {
      legacyId: 'final',
      time: f.time,
      questions: convertQuiz(f.questions),
      tasks: f.tasks.map(t => convertTask(t, false)),
    };
  }
  return course;
}

/* ---------- статистика для верификации ---------- */
function statsOf(course) {
  let lessons = 0, quiz = 0, tasks = 0, exams = 0, examQ = 0, examT = 0;
  course.modules.forEach(m => {
    lessons += m.lessons.length;
    quiz += m.quiz.length;
    tasks += m.tasks.length;
    exams += 1;
    examQ += m.exam.questions.length;
    examT += (m.exam.tasks || []).length;
  });
  if (course.finalExam) { exams++; examQ += course.finalExam.questions.length; examT += course.finalExam.tasks.length; }
  return { lessons, quiz, tasks, exams, examQ, examT };
}

/* ---------- main ---------- */
function main() {
  const legacy = loadLegacy();
  fs.mkdirSync(OUT_COURSES, { recursive: true });
  fs.mkdirSync(OUT_SQL, { recursive: true });

  const total = { lessons: 0, quiz: 0, tasks: 0, exams: 0, examQ: 0, examT: 0 };
  const report = [];

  for (const spec of COURSE_MAP) {
    const course = buildCourse(spec, legacy);
    const file = path.join(OUT_COURSES, spec.id + '.json');
    fs.writeFileSync(file, JSON.stringify(course, null, 1), 'utf8');
    const s = statsOf(course);
    Object.keys(total).forEach(k => { total[k] += s[k]; });
    report.push({ course: spec.id, modules: course.modules.length, ...s });
  }

  fs.writeFileSync(path.join(OUT_SQL, 'store-db.sql'), legacy.SEED.trim() + '\n', 'utf8');

  console.table(report);
  console.log('ИТОГО:', total);

  /* Верификация: пересчёт из legacy напрямую */
  const src = { lessons: 0, quiz: 0, tasks: 0, exams: 0, examQ: 0, examT: 0 };
  for (const m of legacy.COURSE.modules) {
    const d = legacy.DATA[m.id];
    src.lessons += d.theory.length;
    src.quiz += d.quiz.length;
    src.tasks += d.tasks.length;
    src.exams += 1;
    src.examQ += d.exam.questions.length;
    src.examT += (d.exam.tasks || (d.exam.task ? [d.exam.task] : [])).length;
  }
  const f = legacy.DATA.final;
  src.exams += 1; src.examQ += f.questions.length; src.examT += f.tasks.length;
  console.log('LEGACY:', src);

  const mismatch = Object.keys(src).filter(k => src[k] !== total[k]);
  if (mismatch.length) {
    console.error('❌ ПОТЕРЯ ДАННЫХ по полям:', mismatch.join(', '));
    process.exit(1);
  }
  console.log('✔ Верификация пройдена: контент перенесён без потерь');
}

main();
