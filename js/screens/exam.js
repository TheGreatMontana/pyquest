/** exam.js — экзамен модуля и финальный экзамен курса с разбором ошибок. */
import { t, tr } from '../core/i18n.js';
import { esc, ic, codeBlock, toast, confetti, bindEditor, announce } from '../ui.js';
import { courseMeta, loadCourse, findModule } from '../core/content.js';
import { state, mod } from '../core/state.js';
import { awardExam, awardFinal } from '../core/gamification.js';

let session = null;

export function stopExam() {
  if (session && session.timer) clearInterval(session.timer);
  session = null;
}

export async function renderExam(root, courseId, moduleId) {
  const course = await loadCourse(courseId);
  const isFinal = !moduleId;
  const m = isFinal ? null : findModule(course, moduleId);
  const exam = isFinal ? course.finalExam : (m && m.exam);
  if (!exam) { root.innerHTML = '<p class="muted-text">' + esc(t('common.notFound')) + '</p>'; return; }

  const meta = courseMeta(courseId);
  const S = state();
  const tasks = exam.tasks || [];
  const totalPts = exam.questions.length + tasks.length * 3;
  const sqlMode = !isFinal && m.sqlModule;
  const best = () => isFinal ? (S.finals[courseId] || 0) : mod(courseId, moduleId).examBest;

  const backLink = isFinal
    ? '<a class="back-link" href="#/course/' + courseId + '">' + ic('chevron', 'flip') + ' ' + esc(t('module.back')) + '</a>'
    : '<a class="back-link" href="#/course/' + courseId + '/module/' + moduleId + '/theory">' + ic('chevron', 'flip') + ' ' + esc(tr(m.title)) + '</a>';

  function intro() {
    stopExam();
    root.innerHTML = backLink +
      '<section class="exam-intro"><div class="exam-glyph">' + ic(isFinal ? 'trophy' : 'shield') + '</div>' +
      '<h2>' + esc(isFinal ? t('exam.titleFinal') + ' · ' + tr(meta.title) : t('exam.title') + ' · ' + tr(m.title)) + '</h2>' +
      '<p>' + esc(t('exam.info', { questions: exam.questions.length, tasks: tasks.length, minutes: Math.round(exam.time / 60) })) + '</p>' +
      '<p>' + esc(t('exam.rules')) + '</p>' +
      (best() ? '<p>' + esc(t('exam.best', { pct: best() })) + '</p>' : '') +
      '<button class="btn danger" id="exam-start">' + esc(t('exam.start')) + '</button></section>';
    root.querySelector('#exam-start').addEventListener('click', start);
  }

  function start() {
    session = { idx: 0, pts: 0, timeLeft: exam.time, timer: null, taskIdx: 0, answers: [], taskResults: [] };
    session.timer = setInterval(() => {
      if (!session) return;
      session.timeLeft--;
      const el = document.getElementById('ex-time');
      if (el) {
        const mm = Math.floor(session.timeLeft / 60), ss = session.timeLeft % 60;
        el.textContent = mm + ':' + String(ss).padStart(2, '0');
        if (session.timeLeft <= 60) el.closest('.exam-timer').classList.add('low');
      }
      if (session.timeLeft <= 0) { clearInterval(session.timer); finish(); }
    }, 1000);
    drawQ();
  }

  const timerHtml = () => '<div class="exam-timer"><span>' + ic('clock') + ' <b id="ex-time">…</b></span></div>';

  function drawQ() {
    if (!session) return;
    if (session.idx >= exam.questions.length) return drawTask();
    const q = exam.questions[session.idx];
    root.innerHTML = backLink + timerHtml() +
      '<section class="quiz-box"><p class="quiz-q">' +
      esc(t('quiz.question', { n: session.idx + 1, total: exam.questions.length })) + ': ' + tr(q.q) + '</p>' +
      (q.code ? codeBlock(q.code, sqlMode ? 'sql' : 'python') : '') +
      '<div class="quiz-opts">' + q.options.map((o, i) =>
        '<button class="quiz-opt" data-i="' + i + '">' + esc(tr(o)) + '</button>').join('') + '</div></section>';
    root.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
      const chosen = +btn.getAttribute('data-i');
      session.answers.push(chosen);
      if (chosen === q.a) session.pts++;
      session.idx++;
      drawQ();
    }));
  }

  function drawTask() {
    if (!session) return;
    if (session.taskIdx >= tasks.length) return finish();
    const task = tasks[session.taskIdx];
    const isSql = task.kind === 'sql';
    root.innerHTML = backLink + timerHtml() +
      '<section class="task-view"><h2>' + esc(t('exam.task', { n: session.taskIdx + 1, total: tasks.length })) +
      ': ' + esc(tr(task.title)) + ' <span class="gold-text">' + esc(t('exam.points', { n: 3 })) + '</span></h2>' +
      '<div class="task-desc">' + tr(task.desc) + '</div>' +
      '<textarea class="editor" id="ed" spellcheck="false">' + esc(task.starter) + '</textarea>' +
      '<div class="task-actions">' +
      '<button class="btn blue" id="run-btn">' + ic('play') + ' ' + esc(t(isSql ? 'task.runSql' : 'task.run')) + '</button>' +
      '<button class="btn" id="submit-btn">' + esc(t('exam.submit')) + '</button>' +
      '<span class="py-loading" id="py-status" role="status"></span></div>' +
      '<div class="run-out" id="out">' + esc(t('exam.beforeSubmit')) + '</div></section>';

    const ed = root.querySelector('#ed');
    const out = root.querySelector('#out');
    const status = root.querySelector('#py-status');
    bindEditor(ed, null);

    root.querySelector('#run-btn').addEventListener('click', async () => {
      out.textContent = t('lesson.running');
      try {
        if (isSql) {
          const res = await window.SqlRunner.run(ed.value, s => { status.textContent = s; });
          status.textContent = '';
          out.innerHTML = res.error ? '<span class="err">' + esc(res.error) + '</span>' : window.SqlRunner.tableHtml(res.result);
        } else {
          const res = await window.PyRunner.run(ed.value, '', task.stdin || [], s => { status.textContent = s; });
          status.textContent = '';
          out.innerHTML = res.err ? '<span class="err">' + esc(res.err) + '</span>' : esc(res.out || t('lesson.noOutput'));
        }
      } catch (e) { out.textContent = '⚠ ' + e.message; }
    });

    root.querySelector('#submit-btn').addEventListener('click', async () => {
      out.textContent = t('lesson.running');
      try {
        if (isSql) {
          const res = await window.SqlRunner.check(ed.value, task, s => { status.textContent = s; });
          session.taskResults.push({ title: tr(task.title), ok: res.ok, detail: res.ok ? '' : res.message });
          if (res.ok) session.pts += 3;
        } else {
          const res = await window.PyRunner.run(ed.value, task.tests, task.stdin || [], s => { status.textContent = s; });
          const ok = !res.err && !res.test_err;
          session.taskResults.push({ title: tr(task.title), ok, detail: ok ? '' : (res.test_err || res.err || '') });
          if (ok) session.pts += 3;
        }
      } catch (e) {
        session.taskResults.push({ title: tr(task.title), ok: false, detail: e.message });
      }
      session.taskIdx++;
      drawTask();
    });
  }

  function finish() {
    if (!session) return;
    const s = session;
    if (s.timer) clearInterval(s.timer);
    const pct = Math.round((s.pts / totalPts) * 100);
    const passed = pct >= 70;

    const gained = isFinal ? awardFinal(courseId, pct) : awardExam(courseId, moduleId, pct);
    if (gained) toast('+' + gained + ' XP');
    if (passed) confetti(100);

    /* Разбор ошибок */
    let review = '';
    exam.questions.forEach((q, i) => {
      const given = s.answers[i];
      if (given === q.a) return;
      review += '<div class="review-item">' +
        '<div class="review-q"><span class="review-num">' + (i + 1) + '</span>' + tr(q.q) + '</div>' +
        (q.code ? codeBlock(q.code, sqlMode ? 'sql' : 'python') : '') +
        '<p class="review-ans bad">' + esc(t('exam.yourAnswer', { answer: given === undefined ? t('exam.timeout') : tr(q.options[given]) })) + '</p>' +
        '<p class="review-ans good">' + esc(t('exam.rightAnswer', { answer: tr(q.options[q.a]) })) + '</p>' +
        (q.explain ? '<p class="review-explain">' + tr(q.explain) + '</p>' : '') +
        '</div>';
    });
    tasks.forEach((task, i) => {
      const tr_ = s.taskResults[i];
      if (tr_ && tr_.ok) return;
      review += '<div class="review-item">' +
        '<div class="review-q"><span class="review-num">' + ic('terminal') + '</span>' + esc(tr(task.title)) + '</div>' +
        '<p class="review-ans bad">' + (tr_ ? esc(t('exam.taskFailed')) + (tr_.detail ? ': ' + esc(tr_.detail) : '') : esc(t('exam.taskTimeout'))) + '</p>' +
        '<p class="review-explain">' + esc(t('exam.taskAdvice')) + '</p></div>';
    });

    root.innerHTML = backLink +
      '<section class="quiz-box"><div class="quiz-result">' +
      '<div class="score-ring' + (passed ? ' pass' : '') + '"><span>' + pct + '%</span></div>' +
      '<h2>' + esc(t('exam.score', { pts: s.pts, total: totalPts })) + '</h2>' +
      '<p>' + esc(passed ? (isFinal ? t('exam.passedFinal') : t('exam.passed')) : t('exam.failed')) + '</p>' +
      '<button class="btn secondary" id="ex-retry">' + esc(t('exam.retry')) + '</button> ' +
      (passed
        ? (isFinal
          ? '<a class="btn" href="#/cert/' + courseId + '">' + esc(t('exam.certificate')) + '</a>'
          : '<a class="btn" href="#/course/' + courseId + '">' + esc(t('exam.toMap')) + '</a>')
        : '') +
      '</div></section>' +
      (review
        ? '<section class="review-wrap"><h3>' + ic('target') + ' ' + esc(t('exam.review')) + '</h3>' + review + '</section>'
        : '<section class="review-wrap perfect"><h3>' + ic('check', 'ok') + ' ' + esc(t('exam.reviewPerfect')) + '</h3></section>');

    announce(t('exam.score', { pts: s.pts, total: totalPts }));
    root.querySelector('#ex-retry').addEventListener('click', intro);
    session = null;
  }

  intro();
}
