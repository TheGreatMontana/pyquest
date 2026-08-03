/** catalog.js — каталог направлений и страница направления (визуальный роадмап пути). */
import { t, tr } from '../core/i18n.js';
import { esc, ic, progressBar, statusBadge } from '../ui.js';
import { getCatalog, domain, courseMeta, careerPath, pathCourses, domainsUsingCourse } from '../core/content.js';
import { state, persist } from '../core/state.js';
import { courseStatus, courseProgress, pathProgress, STATUS } from '../core/graph.js';

const statusLabel = (s) => t('catalog.status' + s.charAt(0).toUpperCase() + s.slice(1));

export function renderCatalog(root) {
  const cat = getCatalog();

  const domainCard = (d) => {
    const pp = d.careerPath ? pathProgress(d.careerPath) : null;
    const href = d.status === 'planned' ? '#/domain/' + d.id : '#/domain/' + d.id;
    return '<a class="domain-card status-' + d.status + '" href="' + href + '" style="--tc:' + esc(d.color) + '">' +
      '<span class="dc-glyph">' + ic(d.glyph) + '</span>' +
      '<span class="dc-status">' + esc(statusLabel(d.status)) + '</span>' +
      '<h3>' + esc(tr(d.title)) + '</h3>' +
      '<p>' + esc(tr(d.tagline)) + '</p>' +
      (pp && pp.total ? progressBar(pp.pct) + '<span class="dc-meta">' + pp.done + '/' + pp.total + ' ' + esc(t('domain.courses')) + '</span>' : '') +
      '</a>';
  };

  const ordered = cat.domains.slice().sort((a, b) => {
    const rankOf = x => x.status === 'full' ? 0 : x.status === 'starter' ? 1 : 2;
    return rankOf(a) - rankOf(b);
  });

  const courseCard = (c) => {
    const cs = courseStatus(c.id);
    const p = cs.progress || courseProgress(c.id);
    return '<a class="course-card ' + cs.status + '" href="#/course/' + c.id + '" style="--tc:' + esc(c.color) + '">' +
      '<div class="cc-head"><span class="cc-glyph">' + ic(c.glyph) + '</span>' + statusBadge(cs.status) + '</div>' +
      '<h4>' + esc(tr(c.title)) + '</h4>' +
      '<p>' + esc(tr(c.description)) + '</p>' +
      progressBar(p.pct) +
      '<span class="cc-meta">' + esc(t('course.level.' + c.level)) + ' · ' + c.moduleCount + ' ' + esc(t('course.modules')) +
      ' · ' + esc(t('domain.hours', { n: c.estimatedHours })) + '</span></a>';
  };

  root.innerHTML =
    '<div class="page-head"><h1>' + ic('layers') + ' ' + esc(t('catalog.title')) + '</h1>' +
    '<p>' + esc(t('catalog.subtitle')) + '</p></div>' +
    '<div class="domain-grid">' + ordered.map(domainCard).join('') + '</div>' +
    '<h2 class="section-title">' + ic('book') + ' ' + esc(t('catalog.allCourses')) +
    ' <small>' + esc(t('catalog.coursesSubtitle')) + '</small></h2>' +
    '<div class="course-grid">' + cat.courses.map(courseCard).join('') + '</div>';
}

export function renderDomain(root, domainId) {
  const d = domain(domainId);
  if (!d) { root.innerHTML = '<p class="muted-text">' + esc(t('common.notFound')) + '</p>'; return; }

  const S = state();
  S.activeDomain = domainId;          // дашборд будет показывать это направление
  persist();

  const path = d.careerPath ? careerPath(d.careerPath) : null;
  const pp = path ? pathProgress(d.careerPath) : { done: 0, total: 0, pct: 0 };

  let stagesHtml = '';
  if (path) {
    path.stages.forEach((stage, si) => {
      const courses = (stage.courses || []).map(id => courseMeta(id)).filter(Boolean);
      const nodes = courses.map(c => {
        const cs = courseStatus(c.id);
        const p = cs.progress || courseProgress(c.id);
        const missing = (cs.missingCourses || []).map(mc => tr(mc.title)).join(', ');
        return '<a class="rm-node ' + cs.status + '" href="#/course/' + c.id + '" style="--tc:' + esc(c.color) + '">' +
          '<span class="rmn-glyph">' + ic(c.glyph) + '</span>' +
          '<span class="rmn-body"><b>' + esc(tr(c.title)) + '</b>' +
          '<span class="rmn-meta">' + esc(t('course.level.' + c.level)) + ' · ' + c.moduleCount + ' ' + esc(t('course.modules')) + ' · ' + esc(t('domain.hours', { n: c.estimatedHours })) + '</span>' +
          progressBar(p.pct) +
          (cs.status === STATUS.LOCKED && missing ? '<span class="rmn-locked">' + ic('lock') + ' ' + esc(t('course.lockedHint', { list: missing })) + '</span>' : '') +
          '</span>' + statusBadge(cs.status) + '</a>';
      }).join('');

      stagesHtml += '<div class="rm-stage">' +
        '<div class="rm-stage-head"><span class="rm-stage-num">' + (si + 1) + '</span>' +
        '<h3>' + esc(tr(stage.title)) + '</h3></div>' +
        '<div class="rm-stage-nodes">' +
        (nodes || '<p class="rm-external">' + ic('external') + ' ' + esc(t('domain.externalStage')) +
          ' <a href="#/roadmap">' + esc(t('nav.roadmap')) + '</a></p>') +
        '</div></div>';
    });
  }

  root.innerHTML =
    '<a class="back-link" href="#/catalog">' + ic('chevron', 'flip') + ' ' + esc(t('nav.catalog')) + '</a>' +
    '<div class="domain-head" style="--tc:' + esc(d.color) + '">' +
    '<span class="dh-glyph">' + ic(d.glyph) + '</span>' +
    '<div><p class="dh-kicker">' + esc(t('domain.path')) + ' · ' + esc(statusLabel(d.status)) + '</p>' +
    '<h1>' + esc(tr(d.title)) + '</h1><p class="dh-tagline">' + esc(tr(d.tagline)) + '</p></div>' +
    (pp.total ? '<div class="dh-progress"><span>' + esc(t('domain.progress')) + '</span>' + progressBar(pp.pct) +
      '<b>' + pp.done + '/' + pp.total + '</b></div>' : '') +
    '</div>' +
    (d.status === 'planned'
      ? '<div class="notice">' + ic('info') + ' ' + esc(t('catalog.plannedNote')) + '</div>'
      : '') +
    (path ? '<div class="rm-path">' + stagesHtml + '</div>' : '');
}
