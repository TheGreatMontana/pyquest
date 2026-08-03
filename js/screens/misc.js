/** misc.js — роадмап ментора, практика, оценка уровня и сертификат. */
import { t, tr, formatDate, getLang } from '../core/i18n.js';
import { esc, ic, toast, confetti } from '../ui.js';
import { getCatalog, courseMeta, loadCourse } from '../core/content.js';
import { state, persist, mod } from '../core/state.js';
import { rank } from '../core/gamification.js';
import { courseStatus, courseProgress, STATUS } from '../core/graph.js';

/* ---------- роадмап ментора (материалы вне платформы) ---------- */
export function renderRoadmap(root) {
  const cat = getCatalog();
  const S = state();
  const rm = cat.mentorRoadmap || [];

  const onSite = [
    { courses: ['python-basics', 'python-intermediate', 'python-advanced'], key: 'Python' },
    { courses: ['sql-basics', 'sql-advanced'], key: 'SQL' },
    { courses: ['algorithms'], key: 'Algorithms' },
  ].map(g => {
    const done = g.courses.every(id => courseStatus(id).status === STATUS.COMPLETED);
    const titles = g.courses.map(id => tr(courseMeta(id).title)).join(' → ');
    return '<div class="rm-item static' + (done ? ' done' : '') + '">' +
      '<span class="rm-check">' + (done ? ic('check') : '') + '</span><span>' + esc(titles) + '</span></div>';
  }).join('');

  let html = '<div class="page-head"><h1>' + ic('map') + ' ' + esc(t('roadmap.title')) + '</h1>' +
    '<p>' + esc(t('roadmap.subtitle')) + '</p></div>' +
    '<section class="rm-section"><h2>' + esc(t('roadmap.onSite')) + '</h2><div class="rm-list">' + onSite + '</div></section>';

  rm.forEach(sec => {
    html += '<section class="rm-section"><h2>' + esc(tr(sec.title)) + '</h2><div class="rm-list">' +
      sec.items.map(it => {
        const done = !!(S.rm || {})[it.id];
        return '<button class="rm-item' + (done ? ' done' : '') + '" data-rm="' + esc(it.id) + '" aria-pressed="' + done + '">' +
          '<span class="rm-check">' + (done ? ic('check') : '') + '</span>' +
          '<span class="rm-text">' + esc(tr(it.text)) +
          (it.link ? ' <a href="' + esc(it.link) + '" target="_blank" rel="noopener" class="rm-link">' + ic('external') + ' ' + esc(t('roadmap.open')) + '</a>' : '') +
          '</span></button>';
      }).join('') + '</div></section>';
  });

  if (cat.mentorLinks) {
    html += '<section class="rm-section"><h2>' + esc(t('roadmap.playlists')) + '</h2><div class="rm-list">' +
      cat.mentorLinks.map(l => '<div class="rm-item static"><span class="rm-check"></span><span>' + esc(tr(l.text)) +
        ' <a href="' + esc(l.link) + '" target="_blank" rel="noopener" class="rm-link">' + ic('external') + ' ' + esc(t('roadmap.open')) + '</a></span></div>').join('') +
      '</div><p class="rm-note">' + esc(t('roadmap.filesNote')) + '</p></section>';
  }

  root.innerHTML = html;
  root.querySelectorAll('[data-rm]').forEach(el => el.addEventListener('click', () => {
    const id = el.getAttribute('data-rm');
    if (!S.rm) S.rm = {};
    S.rm[id] = !S.rm[id];
    persist();
    renderRoadmap(root);
  }));
}

/* ---------- практика: задачи из пройденных курсов вперемешку ---------- */
export async function renderPractice(root) {
  const cat = getCatalog();
  const S = state();
  const startedCourses = cat.courses.filter(c => courseProgress(c.id).started);

  if (!startedCourses.length) {
    root.innerHTML = '<div class="page-head"><h1>' + ic('terminal') + ' ' + esc(t('practice.title')) + '</h1></div>' +
      '<p class="muted-text">' + esc(t('practice.empty')) + '</p>';
    return;
  }

  root.innerHTML = '<div class="page-head"><h1>' + ic('terminal') + ' ' + esc(t('practice.title')) + '</h1>' +
    '<p>' + esc(t('practice.subtitle')) + '</p></div><p class="loading">' + esc(t('common.loading')) + '</p>';

  const pool = [];
  for (const c of startedCourses) {
    try {
      const course = await loadCourse(c.id);
      course.modules.forEach(m => {
        const st = mod(c.id, m.id);
        if (!st.theory) return;                       // практика — только по изученному
        m.tasks.forEach(task => pool.push({
          courseId: c.id, moduleId: m.id, taskId: task.id,
          title: tr(task.title), brief: tr(task.brief || ''),
          kind: task.kind, solved: !!st.tasks[task.id],
          courseTitle: tr(c.title), color: c.color,
        }));
      });
    } catch (e) { /* курс без контента — пропускаем */ }
  }

  const unsolved = pool.filter(x => !x.solved);
  const list = (unsolved.length ? unsolved : pool).slice(0, 24);

  root.innerHTML = '<div class="page-head"><h1>' + ic('terminal') + ' ' + esc(t('practice.title')) + '</h1>' +
    '<p>' + esc(t('practice.subtitle')) + '</p></div>' +
    '<div class="task-list">' + list.map(x =>
      '<a class="task-item' + (x.solved ? ' solved' : '') + '" href="#/course/' + x.courseId + '/module/' + x.moduleId + '/tasks/' + x.taskId + '" style="--tc:' + esc(x.color) + '">' +
      '<span class="t-ico">' + (x.solved ? ic('check', 'ok') : ic(x.kind === 'sql' ? 'db' : 'terminal')) + '</span>' +
      '<span><b>' + esc(x.title) + '</b><span class="t-brief">' + esc(x.courseTitle) + (x.brief ? ' · ' + esc(x.brief) : '') + '</span></span>' +
      '</a>').join('') + '</div>';
}

/* ---------- оценка уровня ---------- */
export async function renderAssessment(root, courseId) {
  const meta = courseMeta(courseId);
  if (!meta) { root.innerHTML = '<p class="muted-text">' + esc(t('common.notFound')) + '</p>'; return; }

  root.innerHTML = '<p class="loading">' + esc(t('common.loading')) + '</p>';
  const course = await loadCourse(courseId);

  /* Вопросы берём из экзаменов модулей: по 2 из каждого, равномерно по курсу */
  const pool = [];
  course.modules.forEach((m, mi) => {
    (m.exam.questions || []).slice(0, 2).forEach(q => pool.push({ q, moduleIndex: mi, module: m }));
  });
  const questions = pool.slice(0, 10);
  if (!questions.length) {
    root.innerHTML = '<div class="notice">' + ic('info') + ' ' + esc(t('common.contentMissing')) + '</div>';
    return;
  }

  const backLink = '<a class="back-link" href="#/course/' + courseId + '">' + ic('chevron', 'flip') + ' ' + esc(tr(meta.title)) + '</a>';
  const session = { idx: 0, correct: 0, perModule: {} };

  function intro() {
    root.innerHTML = backLink +
      '<section class="exam-intro"><div class="exam-glyph">' + ic('target') + '</div>' +
      '<h2>' + esc(t('assess.title', { course: tr(meta.title) })) + '</h2>' +
      '<p>' + esc(t('assess.intro')) + '</p>' +
      '<button class="btn" id="as-start">' + esc(t('assess.start')) + '</button></section>';
    root.querySelector('#as-start').addEventListener('click', draw);
  }

  function draw() {
    if (session.idx >= questions.length) return result();
    const item = questions[session.idx];
    const q = item.q;
    root.innerHTML = backLink +
      '<section class="quiz-box"><div class="quiz-progress" aria-hidden="true">' +
      questions.map((_, i) => '<i class="' + (i < session.idx ? 'done' : '') + '"></i>').join('') + '</div>' +
      '<p class="quiz-q">' + esc(t('quiz.question', { n: session.idx + 1, total: questions.length })) + ': ' + tr(q.q) + '</p>' +
      (q.code ? '<pre class="code"><code>' + esc(q.code) + '</code></pre>' : '') +
      '<div class="quiz-opts">' + q.options.map((o, i) =>
        '<button class="quiz-opt" data-i="' + i + '">' + esc(tr(o)) + '</button>').join('') + '</div></section>';
    root.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
      const ok = +btn.getAttribute('data-i') === q.a;
      if (ok) {
        session.correct++;
        session.perModule[item.moduleIndex] = (session.perModule[item.moduleIndex] || 0) + 1;
      }
      session.idx++;
      draw();
    }));
  }

  function result() {
    const pct = Math.round((session.correct / questions.length) * 100);
    const levelKey = pct >= 90 ? 'advanced' : pct >= 70 ? 'upper' : pct >= 50 ? 'intermediate' : pct >= 30 ? 'elementary' : 'beginner';

    /* Первый модуль, где пользователь ошибся — оттуда и рекомендуем начать */
    let startModule = 0;
    for (let i = 0; i < course.modules.length; i++) {
      const asked = questions.filter(x => x.moduleIndex === i).length;
      const right = session.perModule[i] || 0;
      if (asked && right < asked) { startModule = i; break; }
      if (asked) startModule = Math.min(i + 1, course.modules.length - 1);
    }

    const S = state();
    S.assessments[courseId] = { level: levelKey, pct, at: new Date().toISOString() };
    persist();

    const target = course.modules[startModule];
    root.innerHTML = backLink +
      '<section class="quiz-box"><div class="quiz-result">' +
      '<div class="score-ring pass"><span>' + pct + '%</span></div>' +
      '<h2>' + esc(t('assess.result', { level: t('assess.level.' + levelKey) })) + '</h2>' +
      '<p>' + esc(startModule === 0 ? t('assess.recommendAll') : t('assess.recommendFrom', { module: tr(target.title) })) + '</p>' +
      '<a class="btn" href="#/course/' + courseId + '/module/' + target.id + '/theory">' + esc(t('assess.goToModule')) + '</a> ' +
      '<a class="btn secondary" href="#/course/' + courseId + '/module/' + course.modules[0].id + '/theory">' + esc(t('assess.startFromBegin')) + '</a>' +
      '</div></section>';
  }

  intro();
}

/* ---------- сертификат ---------- */
export function renderCertificate(root, courseId) {
  const S = state();
  const meta = courseMeta(courseId);
  const score = S.finals[courseId] || 0;
  if (!meta || score < 70) { location.hash = '#/'; return; }

  root.innerHTML = '<a class="back-link" href="#/course/' + courseId + '">' + ic('chevron', 'flip') + ' ' + esc(tr(meta.title)) + '</a>' +
    '<div class="cert-wrap"><h1>' + esc(t('cert.title')) + '</h1>' +
    '<p class="muted-text">' + esc(t('cert.namePrompt')) + '</p>' +
    '<p class="cert-controls"><label class="sr-only" for="cert-name">' + esc(t('cert.namePlaceholder')) + '</label>' +
    '<input class="name-input" id="cert-name" placeholder="' + esc(t('cert.namePlaceholder')) + '" value="' + esc(S.name || '') + '"> ' +
    '<button class="btn small" id="cert-draw">' + esc(t('cert.update')) + '</button></p>' +
    '<canvas id="cert-canvas" width="1200" height="850" aria-label="' + esc(t('cert.title')) + '"></canvas><br>' +
    '<a class="btn" id="cert-dl" download="pyquest-certificate.png">' + ic('external') + ' ' + esc(t('cert.download')) + '</a></div>';

  function draw() {
    const name = root.querySelector('#cert-name').value.trim() || '—';
    S.name = name; persist();
    const cv = root.querySelector('#cert-canvas');
    const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 1200, 850);
    g.addColorStop(0, '#0c1322'); g.addColorStop(1, '#101d33');
    x.fillStyle = g; x.fillRect(0, 0, 1200, 850);
    x.strokeStyle = '#38bdf8'; x.lineWidth = 4; x.strokeRect(30, 30, 1140, 790);
    x.strokeStyle = '#1e293b'; x.lineWidth = 2; x.strokeRect(46, 46, 1108, 758);
    x.textAlign = 'center';
    x.fillStyle = '#38bdf8'; x.font = 'bold 54px Inter, Segoe UI, sans-serif';
    x.fillText(t('cert.title').toUpperCase(), 600, 200);
    x.fillStyle = '#8b98ac'; x.font = '25px Inter, Segoe UI, sans-serif';
    x.fillText(t('cert.line1'), 600, 265);
    x.fillStyle = '#ffffff'; x.font = 'bold 52px Inter, Segoe UI, sans-serif';
    x.fillText(name, 600, 345);
    x.fillStyle = '#e6ebf4'; x.font = '27px Inter, Segoe UI, sans-serif';
    x.fillText(t('cert.line2'), 600, 405);
    x.fillStyle = '#34d399'; x.font = 'bold 38px Inter, Segoe UI, sans-serif';
    x.fillText('PyQuest · ' + tr(meta.title), 600, 465);
    x.fillStyle = '#8b98ac'; x.font = '23px Inter, Segoe UI, sans-serif';
    x.fillText(t('exam.best', { pct: score }) + ' · ' + S.xp + ' XP', 600, 530);
    x.fillStyle = '#fbbf24'; x.font = 'bold 29px Inter, Segoe UI, sans-serif';
    x.fillText(t('topbar.rank') + ': ' + tr(rank().title), 600, 610);
    x.fillStyle = '#5c6b80'; x.font = '21px Inter, Segoe UI, sans-serif';
    x.fillText(formatDate(new Date()) + ' · course.azizbek-azimov.uz', 600, 720);
    root.querySelector('#cert-dl').href = cv.toDataURL('image/png');
  }
  root.querySelector('#cert-draw').addEventListener('click', draw);
  draw();
  confetti(60);
}
