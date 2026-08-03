/**
 * validate.js — проверка целостности контента платформы.
 *
 * Проверяет: каталог, ссылочную целостность (курсы/навыки/пути),
 * структуру курсов, корректность блоков, покрытие переводами.
 * Выгружает Python- и SQL-фрагменты для прогона реальными движками.
 *
 * Запуск: node tools/validate.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'tools', '.out');

const errors = [];
const warnings = [];
const pySnippets = [];
const sqlItems = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));

/* ---------- мультиязычные поля ---------- */
const LANGS = ['ru', 'uz', 'en'];
const coverage = { ru: 0, uz: 0, en: 0, total: 0 };

function checkMl(field, where, required) {
  if (field === undefined || field === null) {
    if (required) err(where + ': отсутствует обязательное поле');
    return;
  }
  if (typeof field === 'string') { warn(where + ': строка вместо мультиязычного поля'); return; }
  if (typeof field !== 'object') { err(where + ': поле должно быть объектом { ru, uz, en }'); return; }
  if (!field.ru && !field.en) err(where + ': нет ни ru, ни en — нечего показать');
  coverage.total++;
  LANGS.forEach(l => { if (field[l]) coverage[l]++; });
}

/* ---------- каталог ---------- */
const catalog = read(path.join(CONTENT, 'catalog.json'));

const skillIds = new Set(catalog.skills.map(s => s.id));
const courseIds = new Set(catalog.courses.map(c => c.id));
const pathIds = new Set(catalog.careerPaths.map(p => p.id));

catalog.skills.forEach(s => checkMl(s.title, 'skill ' + s.id + '.title', true));

catalog.courses.forEach(c => {
  checkMl(c.title, 'course ' + c.id + '.title', true);
  checkMl(c.description, 'course ' + c.id + '.description', true);
  if (!['beginner', 'intermediate', 'advanced'].includes(c.level)) err('course ' + c.id + ': неверный level');
  if (!['full', 'starter', 'planned'].includes(c.status)) err('course ' + c.id + ': неверный status');
  if (!c.moduleCount) err('course ' + c.id + ': нет moduleCount');
  (c.requires || []).forEach(s => { if (!skillIds.has(s)) err('course ' + c.id + ': неизвестный навык в requires: ' + s); });
  (c.grants || []).forEach(s => { if (!skillIds.has(s)) err('course ' + c.id + ': неизвестный навык в grants: ' + s); });
});

catalog.careerPaths.forEach(p => {
  p.stages.forEach(st => {
    checkMl(st.title, 'stage ' + st.id + '.title', true);
    (st.courses || []).forEach(cid => { if (!courseIds.has(cid)) err('path ' + p.id + ': неизвестный курс ' + cid); });
  });
});

catalog.domains.forEach(d => {
  checkMl(d.title, 'domain ' + d.id + '.title', true);
  checkMl(d.tagline, 'domain ' + d.id + '.tagline', true);
  if (d.careerPath && !pathIds.has(d.careerPath)) err('domain ' + d.id + ': неизвестный careerPath ' + d.careerPath);
  if (d.status !== 'planned' && !d.careerPath) err('domain ' + d.id + ': нефинальный домен без careerPath');
});

catalog.achievements.forEach(a => {
  checkMl(a.title, 'achievement ' + a.id + '.title', true);
  checkMl(a.desc, 'achievement ' + a.id + '.desc', true);
});
catalog.ranks.forEach((r, i) => checkMl(r.title, 'rank ' + i + '.title', true));

/* Пререквизиты: каждый требуемый навык кто-то должен выдавать */
const granted = new Set();
catalog.courses.forEach(c => (c.grants || []).forEach(s => granted.add(s)));
catalog.courses.forEach(c => (c.requires || []).forEach(s => {
  if (!granted.has(s)) err('course ' + c.id + ': навык ' + s + ' требуется, но ни один курс его не выдаёт');
}));

/* Циклы в графе пререквизитов */
(function detectCycles() {
  const grantsBy = {};
  catalog.courses.forEach(c => (c.grants || []).forEach(s => { grantsBy[s] = c.id; }));
  const visit = (id, seen) => {
    if (seen.includes(id)) { err('цикл пререквизитов: ' + seen.concat(id).join(' → ')); return; }
    const c = catalog.courses.find(x => x.id === id);
    if (!c) return;
    (c.requires || []).forEach(s => {
      const src = grantsBy[s];
      if (src) visit(src, seen.concat(id));
    });
  };
  catalog.courses.forEach(c => visit(c.id, []));
})();

/* legacyMap ведёт на существующие курсы */
Object.entries(catalog.legacyMap || {}).forEach(([legacy, target]) => {
  const cid = target.split('/')[0];
  if (!courseIds.has(cid)) err('legacyMap[' + legacy + ']: неизвестный курс ' + cid);
});

/* ---------- курсы ---------- */
const BLOCK_TYPES = ['text', 'code', 'run', 'sqlrun', 'note', 'predict', 'findbug', 'match', 'order', 'checkpoint', 'summary'];
const stats = { courses: 0, modules: 0, lessons: 0, blocks: 0, interactive: 0, quiz: 0, tasks: 0, exams: 0 };
const legacyTargets = new Set(Object.values(catalog.legacyMap || {}));

function checkQuiz(list, where, needExplain) {
  (list || []).forEach((q, i) => {
    const w = where + '.q' + i;
    checkMl(q.q, w, true);
    if (!Array.isArray(q.options) || q.options.length < 2) err(w + ': мало вариантов');
    else q.options.forEach((o, oi) => checkMl(o, w + '.option' + oi, true));
    if (typeof q.a !== 'number' || q.a < 0 || q.a >= (q.options || []).length) err(w + ': неверный индекс ответа');
    if (needExplain && !q.explain) warn(w + ': нет объяснения');
    if (q.explain) checkMl(q.explain, w + '.explain');
    if (q.code && !q.broken) pySnippets.push({ name: w, code: q.code, compileOnly: true, sql: false });
    stats.quiz++;
  });
}

function checkTask(task, where, sqlModule) {
  checkMl(task.title, where + '.title', true);
  checkMl(task.desc, where + '.desc', true);
  if (task.brief) checkMl(task.brief, where + '.brief');
  if (task.hint) checkMl(task.hint, where + '.hint');
  if (task.starter === undefined) err(where + ': нет starter');
  if (task.kind === 'sql') {
    if (!task.solution) err(where + ': SQL-задача без solution');
    else sqlItems.push({ name: where + '.solution', sql: task.solution, expectRows: !task.checkQuery });
    if (task.checkQuery) sqlItems.push({ name: where + '.checkQuery', sql: task.solution + '\n' + task.checkQuery, expectRows: true });
  } else if (task.kind === 'python') {
    if (!task.tests) err(where + ': нет тестов');
    else pySnippets.push({ name: where + '.tests', code: task.tests, compileOnly: true });
    if (task.starter) pySnippets.push({ name: where + '.starter', code: task.starter, compileOnly: true });
  } else err(where + ': неизвестный kind ' + task.kind);
  stats.tasks++;
}

function checkBlocks(blocks, where) {
  (blocks || []).forEach((b, i) => {
    const w = where + '.b' + i;
    stats.blocks++;
    if (!BLOCK_TYPES.includes(b.type)) { err(w + ': неизвестный тип блока ' + b.type); return; }
    switch (b.type) {
      case 'text': case 'note': checkMl(b.html, w + '.html', true); break;
      case 'code': if (!b.code) err(w + ': нет кода'); break;
      case 'run': pySnippets.push({ name: w, code: b.code, exec: true }); break;
      case 'sqlrun': sqlItems.push({ name: w, sql: b.code, expectRows: false }); break;
      case 'predict':
        stats.interactive++;
        if (!b.code) err(w + ': predict без кода');
        else pySnippets.push({ name: w, code: b.code, exec: !b.lang || b.lang === 'python' });
        if (typeof b.a !== 'number' || !b.options || b.a >= b.options.length) err(w + ': неверный ответ predict');
        (b.options || []).forEach((o, oi) => checkMl(o, w + '.option' + oi, true));
        break;
      case 'checkpoint':
        stats.interactive++;
        checkMl(b.q, w + '.q', true);
        if (typeof b.a !== 'number' || !b.options || b.a >= b.options.length) err(w + ': неверный ответ checkpoint');
        (b.options || []).forEach((o, oi) => checkMl(o, w + '.option' + oi, true));
        break;
      case 'findbug':
        stats.interactive++;
        if (!Array.isArray(b.lines) || !b.lines.length) err(w + ': findbug без строк кода');
        if (typeof b.bugLine !== 'number' || b.bugLine >= (b.lines || []).length) err(w + ': неверный bugLine');
        break;
      case 'match':
        stats.interactive++;
        if (!Array.isArray(b.pairs) || b.pairs.length < 2) err(w + ': match требует минимум 2 пары');
        (b.pairs || []).forEach((p, pi) => { checkMl(p.left, w + '.pair' + pi + '.left', true); checkMl(p.right, w + '.pair' + pi + '.right', true); });
        break;
      case 'order':
        stats.interactive++;
        if (!Array.isArray(b.steps) || b.steps.length < 2) err(w + ': order требует минимум 2 шага');
        (b.steps || []).forEach((s, si) => checkMl(s, w + '.step' + si, true));
        break;
      case 'summary':
        if (!Array.isArray(b.items) || !b.items.length) err(w + ': summary без пунктов');
        (b.items || []).forEach((s, si) => checkMl(s, w + '.item' + si, true));
        break;
    }
  });
}

catalog.courses.forEach(meta => {
  const file = path.join(CONTENT, 'courses', meta.id + '.json');
  if (!fs.existsSync(file)) {
    if (meta.status !== 'planned') err('course ' + meta.id + ': нет файла контента ' + file);
    return;
  }
  const course = read(file);
  stats.courses++;
  if (course.id !== meta.id) err('course ' + meta.id + ': id внутри файла не совпадает');
  if (!Array.isArray(course.modules) || !course.modules.length) { err('course ' + meta.id + ': нет модулей'); return; }
  if (course.modules.length !== meta.moduleCount) err('course ' + meta.id + ': moduleCount=' + meta.moduleCount + ', а модулей ' + course.modules.length);

  const ids = new Set();
  course.modules.forEach((m, mi) => {
    const w = meta.id + '/' + m.id;
    stats.modules++;
    if (ids.has(m.id)) err(w + ': дубль id модуля');
    ids.add(m.id);
    checkMl(m.title, w + '.title', true);
    checkMl(m.tagline, w + '.tagline', true);
    if (m.legacyId && !legacyTargets.has(meta.id + '/' + m.id))
      err(w + ': legacyId ' + m.legacyId + ' не отражён в catalog.legacyMap');

    if (!m.lessons || !m.lessons.length) err(w + ': нет уроков');
    (m.lessons || []).forEach(l => {
      stats.lessons++;
      checkMl(l.title, w + '/' + l.id + '.title', true);
      checkBlocks(l.blocks, w + '/' + l.id);
    });
    checkQuiz(m.quiz, w + '.quiz', true);
    if (!m.tasks || m.tasks.length < 1) err(w + ': нет задач');
    const taskIds = new Set();
    (m.tasks || []).forEach(task => {
      if (taskIds.has(task.id)) err(w + ': дубль id задачи ' + task.id);
      taskIds.add(task.id);
      checkTask(task, w + '.task[' + task.id + ']', m.sqlModule);
    });
    if (!m.exam) err(w + ': нет экзамена');
    else {
      stats.exams++;
      if (!m.exam.time) err(w + '.exam: нет времени');
      checkQuiz(m.exam.questions, w + '.exam', false);
      (m.exam.tasks || []).forEach((task, ti) => checkTask(task, w + '.exam.task' + ti, m.sqlModule));
    }
  });

  if (course.finalExam) {
    stats.exams++;
    checkQuiz(course.finalExam.questions, meta.id + '.final', false);
    (course.finalExam.tasks || []).forEach((task, ti) => checkTask(task, meta.id + '.final.task' + ti, false));
  }
});

/* ---------- словари интерфейса ---------- */
const dicts = {};
LANGS.forEach(l => {
  const f = path.join(CONTENT, 'i18n', 'ui.' + l + '.json');
  if (!fs.existsSync(f)) { err('нет словаря ui.' + l + '.json'); return; }
  dicts[l] = read(f);
});
if (dicts.ru) {
  const ruKeys = Object.keys(dicts.ru);
  LANGS.filter(l => l !== 'ru').forEach(l => {
    if (!dicts[l]) return;
    const missing = ruKeys.filter(k => !(k in dicts[l]));
    if (missing.length) err('словарь ' + l + ': не хватает ключей (' + missing.length + '): ' + missing.slice(0, 5).join(', '));
    const extra = Object.keys(dicts[l]).filter(k => !ruKeys.includes(k));
    if (extra.length) warn('словарь ' + l + ': лишние ключи: ' + extra.slice(0, 5).join(', '));
  });
}

/* ---------- вывод ---------- */
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'py-snippets.json'), JSON.stringify(pySnippets), 'utf8');
fs.writeFileSync(path.join(OUT, 'sql-items.json'), JSON.stringify(sqlItems), 'utf8');
fs.copyFileSync(path.join(CONTENT, 'sql', 'store-db.sql'), path.join(OUT, 'seed.sql'));

console.log('=== КОНТЕНТ ===');
console.table([stats]);
console.log('Python-фрагментов:', pySnippets.length, '| SQL-фрагментов:', sqlItems.length);
console.log('\n=== ПОКРЫТИЕ ПЕРЕВОДАМИ (поля контента) ===');
LANGS.forEach(l => {
  const pct = coverage.total ? Math.round(coverage[l] / coverage.total * 100) : 0;
  console.log('  ' + l + ': ' + coverage[l] + '/' + coverage.total + ' (' + pct + '%)');
});

if (warnings.length) {
  console.log('\n=== ПРЕДУПРЕЖДЕНИЯ (' + warnings.length + ') ===');
  warnings.slice(0, 15).forEach(w => console.log('  ⚠ ' + w));
  if (warnings.length > 15) console.log('  … и ещё ' + (warnings.length - 15));
}
if (errors.length) {
  console.log('\n=== ОШИБКИ (' + errors.length + ') ===');
  errors.forEach(e => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✔ Валидация пройдена: структура и ссылочная целостность в порядке');
