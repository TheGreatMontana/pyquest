/** dashboard.js — персональный дашборд: что делать прямо сейчас, прогресс, диагностика. */
import { t, tr, formatDate, plural } from '../core/i18n.js';
import { esc, ic, progressBar, statusBadge } from '../ui.js';
import { getCatalog, courseMeta, domain, pathCourses } from '../core/content.js';
import { state } from '../core/state.js';
import { rank, nextRank } from '../core/gamification.js';
import { courseStatus, courseProgress, pathProgress, nextRecommended, weakSpots, stats, skillList, STATUS } from '../core/graph.js';

/** Направление, которое пользователь фактически изучает (или DE по умолчанию). */
export function activeDomain() {
  const S = state();
  if (S.activeDomain && domain(S.activeDomain)) return domain(S.activeDomain);
  const cat = getCatalog();
  const started = cat.domains.find(d => {
    if (!d.careerPath) return false;
    return pathCourses(d.careerPath).some(c => courseProgress(c).started);
  });
  return started || cat.domains.find(d => d.featured) || cat.domains[0];
}

function weekIndex() {
  const S = state();
  const start = new Date((S.start || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  const day = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1);
  return Math.min(Math.ceil(day / 7), getCatalog().mentorPlan.weeks.length);
}

export function renderDashboard(root) {
  const cat = getCatalog();
  const S = state();
  const r = rank(), nr = nextRank();
  const pct = nr ? Math.round(((S.xp - r.xp) / (nr.xp - r.xp)) * 100) : 100;
  const dom = activeDomain();
  const pp = dom.careerPath ? pathProgress(dom.careerPath) : { done: 0, total: 0, pct: 0 };
  const nextId = nextRecommended(dom.careerPath);
  const nextMeta = nextId ? courseMeta(nextId) : null;
  const week = weekIndex();
  const wk = cat.mentorPlan.weeks[week - 1];
  const st = stats();
  const weak = weakSpots(3);
  const skills = skillList();

  /* Курсы текущего направления */
  let courseCards = '';
  if (dom.careerPath) {
    pathCourses(dom.careerPath).forEach(id => {
      const meta = courseMeta(id);
      if (!meta) return;
      const cs = courseStatus(id);
      const p = cs.progress || courseProgress(id);
      courseCards += '<a class="course-card ' + cs.status + '" href="#/course/' + id + '" style="--tc:' + esc(meta.color || '#38bdf8') + '">' +
        '<div class="cc-head"><span class="cc-glyph">' + ic(meta.glyph || 'code') + '</span>' +
        statusBadge(cs.status) + '</div>' +
        '<h4>' + esc(tr(meta.title)) + '</h4>' +
        /* Обрезает CSS по строкам: slice рубил посреди слова и мог разрезать
           HTML-сущность пополам, превратив её в мусор вроде «&am» */
        '<p class="clamp-2">' + esc(tr(meta.description)) + '</p>' +
        /* Нулевая полоса читалась как случайная чёрточка под текстом */
        (p.pct > 0 ? progressBar(p.pct) : '') +
        '<span class="cc-meta">' + p.done + ' / ' + esc(plural(p.total, 'course.modules')) + ' · ' + esc(t('domain.hours', { n: meta.estimatedHours })) + '</span>' +
        '</a>';
    });
  }

  /* Достижения.
     Пятнадцать одинаковых серых карточек внизу дашборда были просто шумом.
     Показываем полученные и ближайшие три, остальные — по кнопке. */
  const achCard = (a) => {
    const un = (S.ach || []).includes(a.id);
    return '<div class="ach ' + (un ? 'unlocked' : 'locked') + '" title="' + esc(tr(a.desc)) + '">' +
      '<span class="ico" aria-hidden="true">' + a.icon + '</span>' +
      '<b>' + esc(tr(a.title)) + '</b><span class="desc">' + esc(tr(a.desc)) + '</span>' +
      '<span class="sr-only">' + (un ? t('status.completed') : t('status.locked')) + '</span></div>';
  };
  const earned = cat.achievements.filter(a => (S.ach || []).includes(a.id));
  const rest = cat.achievements.filter(a => !(S.ach || []).includes(a.id));
  const shown = earned.concat(rest.slice(0, Math.max(3, 6 - earned.length)));
  const hidden = rest.slice(shown.length - earned.length);
  const achHtml = shown.map(achCard).join('') ;
  const achHidden = hidden.map(achCard).join('');

  /* План недели ментора */
  const planHtml = cat.mentorPlan.weeks.map(p => {
    const cls = p.week === week ? ' current' : (p.week < week ? ' past' : '');
    const items = tr(p.items) || [];
    return '<div class="plan-week' + cls + '"><div class="pw-head"><span class="pw-num">' +
      esc(t('domain.stage', { n: p.week })) + '</span>' +
      (p.week === week ? '<span class="pw-now">' + esc(t('status.inProgress')) + '</span>' : '') +
      '<b>' + esc(tr(p.title)) + '</b></div><ul>' +
      (Array.isArray(items) ? items : []).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
  }).join('');

  root.innerHTML =
    /* Герой */
    '<section class="hero"><div class="hero-main">' +
    '<p class="hero-kicker">' + esc(t('dash.kicker', { week, total: cat.mentorPlan.weeks.length })) + '</p>' +
    '<h1>' + esc(t('dash.title')) + '</h1>' +
    '<p class="sub">' + esc(t('dash.subtitle')) + '</p>' +
    '<div class="xp-bar-wrap"><div class="xp-bar-label"><span>' + ic('star') + ' ' + esc(tr(r.title)) + '</span>' +
    '<span>' + (nr ? S.xp + ' / ' + nr.xp + ' XP → ' + esc(tr(nr.title)) : S.xp + ' XP') + '</span></div>' +
    progressBar(pct, 'xp') + '</div>' +
    '<div class="hero-actions">' +
    (nextMeta
      ? '<a class="btn" href="#/course/' + nextId + '">' + ic('play') + ' ' + esc(t('dash.continue', { name: tr(nextMeta.title) })) + '</a>'
      : '<a class="btn" href="#/catalog">' + ic('play') + ' ' + esc(t('dash.startLearning')) + '</a>') +
    '<a class="btn ghost" href="#/catalog">' + ic('layers') + ' ' + esc(t('nav.catalog')) + '</a>' +
    '</div></div>' +
    '<aside class="hero-side"><h3>' + ic('calendar') + ' ' + esc(t('dash.weekPlan', { title: tr(wk.title) })) + '</h3><ul>' +
    ((tr(wk.items) || []).map(x => '<li>' + esc(x) + '</li>').join('')) + '</ul></aside></section>' +

    /* Статистика */
    '<section class="stat-row">' +
    '<div class="stat-tile"><b>' + st.lessons + '</b><span>' + esc(t('dash.statLessons')) + '</span></div>' +
    '<div class="stat-tile"><b>' + st.tasks + '</b><span>' + esc(t('dash.statTasks')) + '</span></div>' +
    '<div class="stat-tile"><b>' + st.exams + '</b><span>' + esc(t('dash.statExams')) + '</span></div>' +
    '<div class="stat-tile"><b>' + st.courses + '</b><span>' + esc(t('dash.statCourses')) + '</span></div>' +
    '</section>' +

    /* Текущее направление */
    '<h2 class="section-title">' + ic(dom.glyph || 'db') + ' ' + esc(t('dash.currentPath')) +
    ' <small>' + esc(tr(dom.title)) + ' · ' + pp.done + '/' + pp.total + ' ' + esc(t('domain.courses')) + '</small>' +
    '<a class="section-link" href="#/domain/' + dom.id + '">' + esc(t('catalog.open')) + ' ' + ic('chevron') + '</a></h2>' +
    '<div class="course-grid">' + courseCards + '</div>' +

    /* Недавно открытые уроки — вернуться туда, где остановился */
    ((S.recent || []).length
      ? '<h2 class="section-title">' + ic('clock') + ' ' + esc(t('dash.recent')) + '</h2><div class="recent-list">' +
      S.recent.slice(0, 4).map(r =>
        '<a class="recent-item" href="#/course/' + esc(r.courseId) + '/module/' + esc(r.moduleId) + '/' + esc(r.tab || 'theory') + '">' +
        ic('book') + '<span><b>' + esc(r.title) + '</b><span class="ri-course">' + esc(r.courseTitle || '') + '</span></span></a>').join('') +
      '</div>'
      : '') +

    /* Закладки */
    ((S.bookmarks || []).length
      ? '<h2 class="section-title">' + ic('star') + ' ' + esc(t('dash.bookmarks')) +
      ' <small>' + S.bookmarks.length + '</small></h2><div class="recent-list">' +
      S.bookmarks.slice(0, 6).map(b =>
        '<a class="recent-item bookmarked" href="#/course/' + esc(b.courseId) + '/module/' + esc(b.moduleId) + '/' + esc(b.tab || 'theory') + '">' +
        ic('star') + '<span><b>' + esc(b.title) + '</b><span class="ri-course">' + esc(b.courseTitle || '') + '</span></span></a>').join('') +
      '</div>'
      : '') +

    /* Диагностика: слабые места */
    (weak.length
      ? '<h2 class="section-title">' + ic('alert') + ' ' + esc(t('dash.weakAreas')) + '</h2><div class="weak-list">' +
      weak.map(w => {
        const meta = courseMeta(w.courseId);
        const reasons = w.reasons.map(rr => (rr.kind === 'quiz' ? t('module.quiz') : t('module.exam')) + ' ' + rr.pct + '%').join(' · ');
        return '<a class="weak-item" href="#/course/' + w.courseId + '/module/' + w.moduleId + '">' +
          ic('target') + '<span><b>' + esc(meta ? tr(meta.title) : w.courseId) + '</b> · ' + esc(w.moduleId) + '</span>' +
          '<span class="weak-score">' + esc(reasons) + '</span></a>';
      }).join('') + '</div>'
      : '') +

    /* Навыки */
    '<h2 class="section-title">' + ic('medal') + ' ' + esc(t('dash.skills')) + ' <small>' + skills.length + '</small></h2>' +
    (skills.length
      ? '<div class="skill-chips">' + skills.map(s => '<span class="skill-chip">' + ic('check') + esc(tr(s.title)) + '</span>').join('') + '</div>'
      : '<p class="muted-text">' + esc(t('dash.noSkills')) + '</p>') +

    /* План ментора */
    '<h2 class="section-title">' + ic('calendar') + ' ' + esc(t('dash.plan')) +
    ' <small>' + esc(t('dash.planStart', { date: formatDate((S.start || '') + 'T00:00:00') })) + '</small></h2>' +
    '<div class="plan-grid">' + planHtml + '</div>' +

    /* Достижения */
    '<h2 class="section-title">' + ic('trophy') + ' ' + esc(t('dash.achievements')) +
    ' <small>' + (S.ach || []).length + ' / ' + cat.achievements.length + '</small></h2>' +
    '<div class="ach-grid">' + achHtml + '</div>' +
    (achHidden
      ? '<div class="ach-grid" id="ach-rest" hidden>' + achHidden + '</div>' +
        '<button class="btn secondary small ach-toggle" id="ach-more" aria-expanded="false">' +
        esc(t('dash.achShowAll', { n: hidden.length })) + '</button>'
      : '');

  const moreBtn = root.querySelector('#ach-more');
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      const box = root.querySelector('#ach-rest');
      const open = box.hidden;
      box.hidden = !open;
      moreBtn.setAttribute('aria-expanded', String(open));
      moreBtn.textContent = open ? t('dash.achHide') : t('dash.achShowAll', { n: hidden.length });
    });
  }
}
