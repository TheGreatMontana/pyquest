/** course.js — страница курса, модуля, уроков теории, квиза и задач. */
import { t, tr, isFallback, getLang } from '../core/i18n.js';
import { esc, ic, progressBar, statusBadge, codeBlock, toast, confetti, bindEditor, announce } from '../ui.js';
import { courseMeta, loadCourse, findModule, skill, domainsUsingCourse } from '../core/content.js';
import { state, mod, persist, isBookmarked, toggleBookmark, noteRecent } from '../core/state.js';
import { courseStatus, courseProgress, isModuleComplete, STATUS } from '../core/graph.js';
import { awardTheory, awardQuiz, awardTask, noteLanguage } from '../core/gamification.js';
import { renderBlocks, bindBlocks, setBlockContext, needsRunner } from '../blocks.js';
import { hintLevels, explainError } from '../core/mentor.js';

/* ---------- раннеры для блоков и задач ---------- */
const runners = {
  py: async (code, onStatus) => window.PyRunner.run(code, '', [], onStatus),
  js: async (code, onStatus) => window.JsRunner.run(code, '', [], onStatus),
  c: async (code, onStatus) => window.CRunner.run(code, 'c', '', onStatus),
  cpp: async (code, onStatus) => window.CRunner.run(code, 'cpp', '', onStatus),
  java: async (code, onStatus) => window.JavaRunner.run(code, 'java', '', onStatus),
  cs: async (code, onStatus) => window.CsRunner.run(code, 'csharp', '', onStatus),
  sql: async (code, onStatus) => {
    const res = await window.SqlRunner.run(code, onStatus);
    return res.error ? { error: res.error } : { html: window.SqlRunner.tableHtml(res.result) };
  },
};

/** Язык задачи → ключ раннера. Чего здесь нет — то запускать пока нечем. */
const RUNNABLE = { python: 'py', javascript: 'js', sql: 'sql', c: 'c', cpp: 'cpp', java: 'java', csharp: 'cs',
                   html: 'web', css: 'web', tailwind: 'web' };
/** Языки вёрстки: результат не текст в консоли, а страница — её надо показывать. */
const WEB_KINDS = ['html', 'css', 'tailwind'];
const LANG_LABEL = { c: 'C', cpp: 'C++', csharp: 'C#', java: 'Java' };

/** Сравнение вывода программы с эталоном: пробелы в конце строк и хвостовые
 *  переводы строки студента наказывать не за что. */
export function sameOutput(actual, expected) {
  const norm = (s) => String(s == null ? '' : s)
    .replace(/\r\n/g, '\n')
    .split('\n').map(l => l.replace(/\s+$/, ''))
    .join('\n').replace(/\n+$/, '');
  return norm(actual) === norm(expected);
}

/* ---------- страница курса ---------- */
export async function renderCourse(root, courseId) {
  const meta = courseMeta(courseId);
  if (!meta) { root.innerHTML = '<p class="muted-text">' + esc(t('common.notFound')) + '</p>'; return; }

  root.innerHTML = '<p class="loading">' + esc(t('common.loading')) + '</p>';
  let course;
  try { course = await loadCourse(courseId); }
  catch (e) {
    root.innerHTML = '<div class="notice">' + ic('info') + ' ' + esc(t('common.contentMissing')) + '</div>';
    return;
  }

  const cs = courseStatus(courseId);
  const p = cs.progress || courseProgress(courseId);
  const usedIn = domainsUsingCourse(courseId);
  const S = state();

  const modulesHtml = course.modules.map((m, i) => {
    const st = mod(courseId, m.id);
    const done = isModuleComplete(st);
    const prev = i === 0 ? null : mod(courseId, course.modules[i - 1].id);
    const unlocked = i === 0 || (prev && prev.examBest >= 70);
    const tasksDone = m.tasks.filter(x => st.tasks[x.id]).length;
    return '<a class="mod-row' + (done ? ' completed' : '') + (unlocked ? '' : ' soft-locked') + '" href="#/course/' + courseId + '/module/' + m.id + '">' +
      '<span class="mod-num" style="--tc:' + esc(meta.color) + '">' + (done ? ic('check') : String(i + 1).padStart(2, '0')) + '</span>' +
      '<span class="mod-info"><b>' + esc(tr(m.title)) + '</b><span>' + esc(tr(m.tagline)) + '</span></span>' +
      '<span class="mod-chips">' +
      '<span class="chip' + (st.theory ? ' ok' : '') + '">' + ic('book') + ' ' + esc(t('module.theory')) + '</span>' +
      '<span class="chip' + (st.quizBest >= 70 ? ' ok' : '') + '">' + ic('target') + ' ' + st.quizBest + '%</span>' +
      '<span class="chip' + (tasksDone === m.tasks.length ? ' ok' : '') + '">' + ic('terminal') + ' ' + tasksDone + '/' + m.tasks.length + '</span>' +
      '<span class="chip' + (st.examBest >= 70 ? ' ok' : '') + '">' + ic('shield') + ' ' + st.examBest + '%</span>' +
      '</span>' +
      '<span class="mod-state">' + (done ? ic('check', 'ok') : unlocked ? ic('chevron') : ic('lock', 'muted')) + '</span></a>';
  }).join('');

  const finalHtml = course.finalExam
    ? '<a class="mod-row final-row' + ((S.finals[courseId] || 0) >= 70 ? ' completed' : '') + '" href="#/course/' + courseId + '/final">' +
    '<span class="mod-num" style="--tc:#fbbf24">' + ic('trophy') + '</span>' +
    '<span class="mod-info"><b>' + esc(t('exam.titleFinal')) + '</b><span>' + esc(tr(meta.title)) + '</span></span>' +
    (S.finals[courseId] ? '<span class="mod-chips"><span class="chip' + (S.finals[courseId] >= 70 ? ' ok' : '') + '">' + S.finals[courseId] + '%</span></span>' : '') +
    '<span class="mod-state">' + ((S.finals[courseId] || 0) >= 70 ? ic('check', 'ok') : ic('chevron')) + '</span></a>'
    : '';

  const skillChips = (list, cls) => (list || []).map(id => {
    const s = skill(id);
    return s ? '<span class="skill-chip ' + cls + '">' + esc(tr(s.title)) + '</span>' : '';
  }).join('');

  root.innerHTML =
    '<a class="back-link" href="#/catalog">' + ic('chevron', 'flip') + ' ' + esc(t('nav.catalog')) + '</a>' +
    '<div class="course-head" style="--tc:' + esc(meta.color) + '">' +
    '<span class="ch-glyph">' + ic(meta.glyph) + '</span>' +
    '<div class="ch-body"><h1>' + esc(tr(meta.title)) + '</h1>' +
    '<p>' + esc(tr(meta.description)) + '</p>' +
    '<div class="ch-meta">' + statusBadge(cs.status) +
    '<span class="chip">' + esc(t('course.level')) + ': ' + esc(t('course.level.' + meta.level)) + '</span>' +
    '<span class="chip">' + course.modules.length + ' ' + esc(t('course.modules')) + '</span>' +
    '<span class="chip">' + esc(t('domain.hours', { n: meta.estimatedHours })) + '</span></div>' +
    '</div>' +
    '<div class="ch-progress">' + progressBar(p.pct) + '<b>' + p.pct + '%</b></div></div>' +

    (cs.status === STATUS.LOCKED && (cs.missingCourses || []).length
      ? '<div class="notice warn">' + ic('lock') + ' ' + esc(t('course.lockedHint', { list: cs.missingCourses.map(c => tr(c.title)).join(', ') })) + '</div>'
      : '') +

    ((meta.requires || []).length || (meta.grants || []).length
      ? '<div class="skills-row">' +
      ((meta.requires || []).length ? '<div><span class="sr-label">' + esc(t('course.requires')) + '</span>' + skillChips(meta.requires, 'req') + '</div>' : '') +
      ((meta.grants || []).length ? '<div><span class="sr-label">' + esc(t('course.grants')) + '</span>' + skillChips(meta.grants, 'grant') + '</div>' : '') +
      '</div>' : '') +

    '<div class="mod-list">' + modulesHtml + finalHtml + '</div>' +

    (usedIn.length > 1
      ? '<p class="used-in">' + esc(t('course.usedIn')) + ': ' +
      usedIn.map(d => '<a href="#/domain/' + d.id + '">' + esc(tr(d.title)) + '</a>').join(', ') + '</p>'
      : '');
}

/* ---------- шапка модуля ---------- */
function modHeader(courseId, course, m, tab) {
  const meta = courseMeta(courseId);
  const st = mod(courseId, m.id);
  const idx = course.modules.findIndex(x => x.id === m.id);
  const tasksDone = m.tasks.filter(x => st.tasks[x.id]).length;
  const tabs = [
    ['theory', ic('book') + ' ' + t('module.theory'), st.theory],
    ['quiz', ic('target') + ' ' + t('module.quiz'), st.quizBest >= 70],
    ['tasks', ic('terminal') + ' ' + t('module.tasks'), tasksDone === m.tasks.length],
    ['exam', ic('shield') + ' ' + t('module.exam'), st.examBest >= 70],
  ];
  const marked = isBookmarked(courseId, m.id, tab);
  return '<a class="back-link" href="#/course/' + courseId + '">' + ic('chevron', 'flip') + ' ' + esc(t('module.back')) + '</a>' +
    '<div class="mod-header" style="--tc:' + esc(meta.color) + '">' +
    '<span class="mod-num big">' + String(idx + 1).padStart(2, '0') + '</span>' +
    '<div><p class="mod-track">' + esc(tr(meta.title)) + ' · ' + esc(t('module.of', { n: idx + 1, total: course.modules.length })) + '</p>' +
    '<h1>' + esc(tr(m.title)) + '</h1><p class="mod-tagline">' + esc(tr(m.tagline)) + '</p></div>' +
    '<button class="bookmark-btn' + (marked ? ' on' : '') + '" data-bm="1"' +
    ' data-course="' + esc(courseId) + '" data-module="' + esc(m.id) + '" data-tab="' + esc(tab) + '"' +
    ' data-title="' + esc(tr(m.title)) + '" data-course-title="' + esc(tr(meta.title)) + '"' +
    ' aria-pressed="' + marked + '" title="' + esc(t(marked ? 'bookmark.remove' : 'bookmark.add')) + '">' +
    ic('star') + '</button></div>' +
    '<div class="tabs" role="tablist">' + tabs.map(x =>
      '<a class="tab' + (tab === x[0] ? ' active' : '') + '" role="tab" aria-selected="' + (tab === x[0]) + '" href="#/course/' + courseId + '/module/' + m.id + '/' + x[0] + '">' +
      x[1] + (x[2] ? ' <span class="done-mark">' + ic('check') + '</span>' : '') + '</a>').join('') + '</div>';
}

/* ---------- модуль: маршрутизация вкладок ---------- */
/**
 * Обработчик закладок вешается один раз на контейнер приложения:
 * содержимое перерисовывается постоянно, а сам контейнер живёт всю сессию,
 * поэтому делегирование переживает смену уроков и вкладок.
 */
export function initBookmarks(appEl) {
  appEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-bm]');
    if (!btn) return;
    const added = toggleBookmark({
      courseId: btn.dataset.course,
      moduleId: btn.dataset.module,
      tab: btn.dataset.tab,
      title: btn.dataset.title,
      courseTitle: btn.dataset.courseTitle,
    });
    btn.classList.toggle('on', added);
    btn.setAttribute('aria-pressed', String(added));
    btn.title = t(added ? 'bookmark.remove' : 'bookmark.add');
    toast(t(added ? 'bookmark.added' : 'bookmark.removed'));
  });
}

export async function renderModule(root, courseId, moduleId, tab, taskId) {
  const course = await loadCourse(courseId);
  const m = findModule(course, moduleId);
  if (!m) { root.innerHTML = '<p class="muted-text">' + esc(t('common.notFound')) + '</p>'; return; }
  noteLanguage(getLang());

  /* «Продолжить с того же места» должно означать, что ты действительно начал,
     а не просто заглянул. Поэтому запоминаем модуль по первому реальному
     действию, а не при открытии страницы. */
  const remember = () => noteRecent({
    courseId, moduleId: m.id, tab: tab || 'theory',
    title: tr(m.title), courseTitle: tr(courseMeta(courseId).title),
  });
  /* Если в модуле уже есть прогресс, он и так «в работе» — освежаем позицию */
  const stNow = mod(courseId, m.id);
  if (stNow.theory || stNow.quizBest || stNow.examBest || Object.keys(stNow.tasks || {}).length) remember();

  if (tab === 'quiz') return renderQuiz(root, courseId, course, m, remember);
  if (tab === 'tasks') return taskId ? renderTask(root, courseId, course, m, taskId, remember) : renderTasks(root, courseId, course, m);
  return renderTheory(root, courseId, course, m, remember);
}

/* ---------- теория ---------- */
function renderTheory(root, courseId, course, m, remember) {
  const st = mod(courseId, m.id);
  let idx = 0;

  function draw() {
    const lesson = m.lessons[idx];
    setBlockContext(courseId, m.id, lesson.id);
    const fallbackNote = isFallback(lesson.title)
      ? '<div class="notice small">' + ic('info') + ' ' + esc(t('common.translationMissing')) + '</div>' : '';

    root.innerHTML = modHeader(courseId, course, m, 'theory') +
      '<article class="theory-card">' + fallbackNote +
      '<h2>' + esc(tr(lesson.title)) + '</h2>' +
      renderBlocks(lesson.blocks) +
      '<div class="theory-nav">' +
      '<button class="btn secondary" id="th-prev"' + (idx === 0 ? ' disabled' : '') + '>' + esc(t('lesson.prev')) + '</button>' +
      '<span class="theory-progress">' + (idx + 1) + ' / ' + m.lessons.length + '</span>' +
      (idx < m.lessons.length - 1
        ? '<button class="btn" id="th-next">' + esc(t('lesson.next')) + ' →</button>'
        : '<button class="btn" id="th-done">' + esc(t(st.theory ? 'lesson.toQuiz' : 'lesson.finish')) + '</button>') +
      '</div></article>';

    bindBlocks(root, lesson.blocks, runners);
    const prev = root.querySelector('#th-prev');
    if (prev) prev.addEventListener('click', () => { idx--; draw(); window.scrollTo(0, 0); });
    const next = root.querySelector('#th-next');
    if (next) next.addEventListener('click', () => { if (remember) remember(); idx++; draw(); window.scrollTo(0, 0); });
    const done = root.querySelector('#th-done');
    if (done) done.addEventListener('click', () => {
      const gained = awardTheory(courseId, m.id);
      if (gained) { toast('+' + gained + ' XP'); confetti(30); }
      location.hash = '#/course/' + courseId + '/module/' + m.id + '/quiz';
    });
  }
  draw();
}

/* ---------- квиз ---------- */
function renderQuiz(root, courseId, course, m, remember) {
  const st = mod(courseId, m.id);
  const qs = m.quiz;
  const session = { idx: 0, correct: 0, results: [] };

  function drawQ() {
    if (session.idx >= qs.length) return drawResult();
    const q = qs[session.idx];
    const bar = qs.map((_, i) => '<i class="' + (i < session.results.length ? (session.results[i] ? 'done' : 'wrong') : '') + '"></i>').join('');
    root.innerHTML = modHeader(courseId, course, m, 'quiz') +
      '<section class="quiz-box"><div class="quiz-progress" aria-hidden="true">' + bar + '</div>' +
      '<p class="quiz-q">' + esc(t('quiz.question', { n: session.idx + 1, total: qs.length })) + ': ' + tr(q.q) + '</p>' +
      (q.code ? codeBlock(q.code, m.sqlModule ? 'sql' : 'python') : '') +
      '<div class="quiz-opts">' + q.options.map((o, i) =>
        '<button class="quiz-opt" data-i="' + i + '">' + esc(tr(o)) + '</button>').join('') + '</div>' +
      '<div id="quiz-after"></div></section>';

    root.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
      if (remember) remember();
      const i = +btn.getAttribute('data-i');
      const ok = i === q.a;
      session.results.push(ok);
      if (ok) session.correct++;
      root.querySelectorAll('.quiz-opt').forEach((b, bi) => {
        b.disabled = true;
        if (bi === q.a) b.classList.add('correct');
        else if (bi === i && !ok) b.classList.add('wrong');
      });
      announce(ok ? t('quiz.correct') : t('quiz.wrong'));
      root.querySelector('#quiz-after').innerHTML =
        '<div class="quiz-explain" role="status"><b>' + esc(t(ok ? 'quiz.correct' : 'quiz.wrong')) + '</b> ' + (q.explain ? tr(q.explain) : '') + '</div>' +
        '<div class="quiz-next"><button class="btn" id="q-next">' +
        esc(session.idx === qs.length - 1 ? t('quiz.result') : t('quiz.next')) + '</button></div>';
      root.querySelector('#q-next').addEventListener('click', () => { session.idx++; drawQ(); });
    }));
  }

  function drawResult() {
    const pct = Math.round((session.correct / qs.length) * 100);
    const gained = awardQuiz(courseId, m.id, session.correct, qs.length);
    if (gained) toast('+' + gained + ' XP');
    if (pct >= 70) confetti(50);
    const msg = pct >= 100 ? t('quiz.perfect') : pct >= 70 ? t('quiz.passed') : t('quiz.failed');
    root.innerHTML = modHeader(courseId, course, m, 'quiz') +
      '<section class="quiz-box"><div class="quiz-result">' +
      '<div class="score-ring' + (pct >= 70 ? ' pass' : '') + '"><span>' + pct + '%</span></div>' +
      '<h2>' + esc(t('quiz.scored', { correct: session.correct, total: qs.length })) + '</h2><p>' + esc(msg) + '</p>' +
      '<button class="btn secondary" id="q-retry">' + esc(t('quiz.retry')) + '</button> ' +
      (pct >= 70
        ? '<a class="btn" href="#/course/' + courseId + '/module/' + m.id + '/tasks">' + esc(t('quiz.toTasks')) + '</a>'
        : '<a class="btn secondary" href="#/course/' + courseId + '/module/' + m.id + '/theory">' + esc(t('quiz.toTheory')) + '</a>') +
      '</div></section>';
    root.querySelector('#q-retry').addEventListener('click', () => renderQuiz(root, courseId, course, m));
  }
  drawQ();
}

/* ---------- список задач ---------- */
function renderTasks(root, courseId, course, m) {
  const st = mod(courseId, m.id);
  const rewards = 40;
  root.innerHTML = modHeader(courseId, course, m, 'tasks') +
    '<p class="tasks-note">' + esc(t(m.sqlModule ? 'task.noteSql' : 'task.notePython')) + '</p>' +
    '<div class="task-list">' + m.tasks.map(x => {
      const solved = !!st.tasks[x.id];
      return '<a class="task-item' + (solved ? ' solved' : '') + '" href="#/course/' + courseId + '/module/' + m.id + '/tasks/' + x.id + '">' +
        '<span class="t-ico">' + (solved ? ic('check', 'ok') : ic('terminal')) + '</span>' +
        '<span><b>' + esc(tr(x.title)) + '</b><span class="t-brief">' + esc(tr(x.brief || '')) + '</span></span>' +
        '<span class="t-xp">+' + rewards + ' XP</span></a>';
    }).join('') + '</div>';
}

/* ---------- одна задача ---------- */
function renderTask(root, courseId, course, m, taskId, remember) {
  const task = m.tasks.find(x => x.id === taskId);
  if (!task) return renderTasks(root, courseId, course, m);
  const st = mod(courseId, m.id);
  const saveKey = 'pyquest_code_' + courseId + '_' + m.id + '_' + taskId;
  const saved = localStorage.getItem(saveKey);
  const isSql = task.kind === 'sql';
  const isWeb = WEB_KINDS.includes(task.kind);
  const runnerKey = RUNNABLE[task.kind];        // undefined для C/C++/C#/Java — их не запускаем
  const runnable = !!runnerKey;

  root.innerHTML = modHeader(courseId, course, m, 'tasks') +
    '<section class="task-view">' +
    '<a class="back-link" href="#/course/' + courseId + '/module/' + m.id + '/tasks">' + ic('chevron', 'flip') + ' ' + esc(t('task.allTasks')) + '</a>' +
    '<h2>' + (st.tasks[taskId] ? ic('check', 'ok') + ' ' : '') + esc(tr(task.title)) + '</h2>' +
    '<div class="task-desc">' + tr(task.desc) + '</div>' +
    (runnable ? '' : '<div class="notice small">' + ic('info') + ' ' + esc(t('task.noRunner', { lang: LANG_LABEL[task.kind] || task.kind })) + '</div>') +
    '<label class="sr-only" for="ed">' + esc(t('module.tasks')) + '</label>' +
    '<textarea class="editor" id="ed" spellcheck="false">' + esc(saved !== null ? saved : task.starter) + '</textarea>' +
    '<div class="task-actions">' +
    (runnable ? '<button class="btn blue" id="run-btn">' + ic('play') + ' ' + esc(t(isSql ? 'task.runSql' : 'task.run')) + '</button>' : '') +
    '<button class="btn" id="check-btn">' + ic('check') + ' ' + esc(t(runnable ? 'task.check' : 'task.selfCheck')) + '</button>' +
    '<button class="btn secondary small" id="hint-btn">' + ic('info') + ' ' + esc(t('mentor.hint')) + '</button>' +
    '<button class="btn secondary small" id="reset-btn">' + esc(t('task.reset')) + '</button>' +
    '<span class="py-loading" id="py-status" role="status"></span></div>' +
    '<div class="hint-box" id="hint" hidden></div>' +
    (isWeb ? '<div class="web-pane"><div class="web-pane-head">' + ic('eye') + ' ' + esc(t('task.preview')) + '</div>' +
             '<div class="web-frame" id="preview"></div></div>' : '') +
    '<div class="run-out" id="out" role="log">' + esc(t('task.output')) + '</div></section>';

  const ed = root.querySelector('#ed');
  const out = root.querySelector('#out');
  const status = root.querySelector('#py-status');
  bindEditor(ed, saveKey);

  /* Вёрстку показываем сразу при открытии задачи: пустая белая панель ничего
     не объясняет, а увидеть исходную разметку до правок — полезно. */
  if (isWeb && window.WebRunner) {
    window.WebRunner.render(root.querySelector('#preview'), task.kind, ed.value, task, null, null);
  }

  /* Прогрессивные подсказки: от направления мысли к скелету решения.
     Готовый ответ не выдаётся — цель научить, а не закрыть задачу. */
  const levels = hintLevels(task);
  let hintIdx = -1;
  const hintBox = root.querySelector('#hint');
  root.querySelector('#hint-btn').addEventListener('click', () => {
    if (hintIdx >= levels.length - 1) {
      hintBox.hidden = false;
      hintBox.innerHTML += '<p class="hint-final">' + esc(t('mentor.noMoreHints')) + '</p>';
      root.querySelector('#hint-btn').disabled = true;
      return;
    }
    hintIdx++;
    const h = levels[hintIdx];
    const body = h.kind === 'skeleton' ? codeBlock(h.code, isSql ? 'sql' : 'python') : '<p>' + tr(h.text) + '</p>';
    hintBox.hidden = false;
    hintBox.innerHTML += '<div class="hint-step"><b>' + esc(t('mentor.hintLevel', { n: hintIdx + 1, total: levels.length })) + '</b>' + body + '</div>';
    root.querySelector('#hint-btn').innerHTML = ic('info') + ' ' + esc(t('mentor.nextHint'));
    announce(t('mentor.hintLevel', { n: hintIdx + 1, total: levels.length }));
  });

  /** Понятное объяснение ошибки под техническим текстом исключения. */
  function mentorNote(message, kind) {
    const ex = explainError(message, kind);
    return '<div class="mentor-note">' + ic('info') + ' <b>' + esc(t('mentor.whatWrong')) + ':</b> ' + esc(ex.text) + '</div>';
  }
  root.querySelector('#reset-btn').addEventListener('click', () => {
    ed.value = task.starter;
    localStorage.removeItem(saveKey);
  });

  function solved() {
    const gained = awardTask(courseId, m.id, taskId);
    if (gained) { toast('+' + gained + ' XP'); confetti(45); }
    const left = m.tasks.filter(x => !st.tasks[x.id]).length;
    if (!left) setTimeout(() => toast(t('task.allSolved'), 'gold'), 400);
  }

  async function exec(withCheck) {
    out.innerHTML = esc(t('lesson.running'));
    try {
      if (isSql) {
        if (!withCheck) {
          const res = await window.SqlRunner.run(ed.value, s => { status.textContent = s; });
          status.textContent = '';
          out.innerHTML = res.error
            ? '<span class="err">' + esc(res.error) + '</span>' + mentorNote(res.error, 'sql')
            : window.SqlRunner.tableHtml(res.result);
        } else {
          const res = await window.SqlRunner.check(ed.value, task, s => { status.textContent = s; });
          status.textContent = '';
          let html = res.result ? window.SqlRunner.tableHtml(res.result) : '';
          if (res.ok) { html += '<p class="ok">' + ic('check') + ' ' + esc(t('task.solved')) + '</p>'; solved(); }
          else {
            html += '<p class="err">' + esc(res.message) + '</p>';
            if (/Ошибка SQL/.test(res.message)) html += mentorNote(res.message, 'sql');
          }
          out.innerHTML = html;
        }
      } else if (isWeb) {
        /* Вёрстку показываем, а не печатаем: студент должен видеть результат.
           Проверки идут внутри того же sandbox-документа. */
        const pane = root.querySelector('#preview');
        status.textContent = '';
        if (!withCheck) {
          window.WebRunner.render(pane, task.kind, ed.value, task, null, null);
          out.innerHTML = '<span class="muted-text">' + esc(t('task.previewHint')) + '</span>';
        } else {
          out.innerHTML = esc(t('lesson.running'));
          window.WebRunner.render(pane, task.kind, ed.value, task, task.tests, (res) => {
            if (res.ok) { out.innerHTML = '<span class="ok">✓ ' + esc(t('task.solved')) + '</span>'; solved(); }
            else out.innerHTML = '<span class="err">✗ ' + esc(res.err) + '</span>';
          });
        }
      } else if (runnerKey === 'c' || runnerKey === 'cpp' || runnerKey === 'java' || runnerKey === 'cs') {
        /* Компилируемые языки собираются настоящим компилятором прямо в браузере.
           Проверка — по выводу программы: он и есть результат работы. */
        const res = await runners[runnerKey](ed.value, s => {
          status.textContent = t('lesson.stage.' + s);
        });
        status.textContent = '';
        if (res.err && !res.out) {
          out.innerHTML = '<span class="err">' + esc(res.err) + '</span>';
          return;
        }
        let html = esc(res.out || t('lesson.noOutput'));
        if (res.err) html += '\n<span class="err">' + esc(res.err) + '</span>';
        if (withCheck && task.expected !== undefined) {
          if (sameOutput(res.out, task.expected)) {
            html += '\n<span class="ok">✓ ' + esc(t('task.solved')) + '</span>';
            solved();
          } else {
            html += '\n<span class="err">✗ ' + esc(t('task.wrongOutput')) + '</span>' +
              '\n<span class="muted-text">' + esc(t('task.expectedOutput')) + '</span>\n' + esc(task.expected);
          }
        }
        out.innerHTML = html;
      } else if (!runnable) {
        /* Языки, для которых компилятора в браузере пока нет: сверка с эталоном. */
        status.textContent = '';
        out.innerHTML = '<div class="self-check">' +
          '<p>' + esc(t('task.selfCheckHint')) + '</p>' +
          (task.solution ? codeBlock(task.solution, task.kind) : '') +
          '</div>';
        if (withCheck) solved();
      } else {
        const runner = runnerKey === 'js' ? window.JsRunner : window.PyRunner;
        const res = await runner.run(ed.value, withCheck ? task.tests : '', task.stdin || [], s => { status.textContent = s; });
        status.textContent = '';
        if (res.err) {
          out.innerHTML = '<span class="err">' + esc(res.err) + '</span>' +
            (runnerKey === 'py' ? mentorNote(res.err, 'python') : '');
          return;
        }
        let html = esc(res.out || t('lesson.noOutput'));
        if (withCheck) {
          if (res.test_err) html += '\n<span class="err">✗ ' + esc(res.test_err) + '</span>';
          else { html += '\n<span class="ok">✓ ' + esc(t('task.solved')) + '</span>'; solved(); }
        }
        out.innerHTML = html;
      }
    } catch (e) {
      status.textContent = '';
      out.innerHTML = '<span class="err">⚠ ' + esc(e.message) + '</span>';
    }
  }
  const runBtn = root.querySelector('#run-btn');
  if (remember) {
    if (runBtn) runBtn.addEventListener('click', remember);
    root.querySelector('#check-btn').addEventListener('click', remember);
  }
  if (runBtn) runBtn.addEventListener('click', () => exec(false));
  root.querySelector('#check-btn').addEventListener('click', () => exec(true));
}
