/**
 * projects.js — режим проектов (раздел 6.5 спецификации).
 *
 * Проект — крупная практическая работа вне тренажёра: пользователь пишет код у себя,
 * а платформа даёт структуру (этапы), критерии готовности (чеклист) и учёт прогресса.
 * XP начисляется за каждый выполненный этап и бонусом за завершение проекта.
 */
import { t, tr } from '../core/i18n.js';
import { esc, ic, progressBar, statusBadge, toast, confetti, announce } from '../ui.js';
import { loadProjects, skill } from '../core/content.js';
import { state, persist } from '../core/state.js';
import { earnedSkills } from '../core/graph.js';
import { awardMilestone, awardProject } from '../core/gamification.js';

/* ---------- состояние проекта ---------- */
export function projectState(id) {
  const S = state();
  if (!S.projects) S.projects = {};
  if (!S.projects[id]) S.projects[id] = { milestones: {}, checklist: {}, startedAt: null, completedAt: null, repo: '' };
  return S.projects[id];
}

export function projectProgress(project) {
  const st = projectState(project.id);
  const done = project.milestones.filter(m => st.milestones[m.id]).length;
  const total = project.milestones.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, completed: !!st.completedAt };
}

function statusOf(project) {
  const p = projectProgress(project);
  if (p.completed) return 'completed';
  if (p.done > 0) return 'in-progress';
  const have = earnedSkills();
  const missing = (project.requires || []).filter(s => !have.has(s));
  return missing.length ? 'locked' : 'available';
}

/* ---------- список проектов ---------- */
export async function renderProjects(root) {
  root.innerHTML = '<p class="loading">' + esc(t('common.loading')) + '</p>';
  let projects;
  try { projects = await loadProjects(); }
  catch (e) {
    root.innerHTML = '<div class="notice">' + ic('info') + ' ' + esc(t('common.contentMissing')) + '</div>';
    return;
  }

  const cards = projects.map(pr => {
    const st = statusOf(pr);
    const p = projectProgress(pr);
    return '<a class="project-card ' + st + '" href="#/project/' + pr.id + '" style="--tc:' + esc(pr.color) + '">' +
      '<div class="pc-head"><span class="pc-glyph">' + ic(pr.glyph) + '</span>' + statusBadge(st) + '</div>' +
      '<h4>' + esc(tr(pr.title)) + '</h4>' +
      '<p>' + esc(tr(pr.summary)) + '</p>' +
      progressBar(p.pct) +
      '<div class="pc-meta">' +
      '<span>' + esc(t('course.level.' + pr.level)) + '</span>' +
      '<span>' + esc(t('domain.hours', { n: pr.estimatedHours })) + '</span>' +
      '<span class="gold-text">+' + pr.xp + ' XP</span>' +
      '</div>' +
      '<div class="pc-tech">' + pr.tech.slice(0, 4).map(x => '<span class="tech-chip">' + esc(x) + '</span>').join('') + '</div>' +
      '</a>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><h1>' + ic('trophy') + ' ' + esc(t('projects.title')) + '</h1>' +
    '<p>' + esc(t('projects.subtitle')) + '</p></div>' +
    '<div class="project-grid">' + cards + '</div>';
}

/* ---------- страница проекта ---------- */
export async function renderProject(root, projectId) {
  const projects = await loadProjects();
  const pr = projects.find(x => x.id === projectId);
  if (!pr) { root.innerHTML = '<p class="muted-text">' + esc(t('common.notFound')) + '</p>'; return; }

  const st = projectState(pr.id);
  if (!st.startedAt) { st.startedAt = new Date().toISOString(); persist(); }

  function draw() {
    const p = projectProgress(pr);
    const status = statusOf(pr);
    const have = earnedSkills();
    const missing = (pr.requires || []).filter(s => !have.has(s)).map(s => skill(s)).filter(Boolean);

    const milestones = pr.milestones.map((m, i) => {
      const done = !!st.milestones[m.id];
      return '<div class="milestone' + (done ? ' done' : '') + '">' +
        '<button class="ms-check" data-ms="' + esc(m.id) + '" aria-pressed="' + done + '" ' +
        'aria-label="' + esc(tr(m.title)) + '">' + (done ? ic('check') : (i + 1)) + '</button>' +
        '<div class="ms-body"><b>' + esc(tr(m.title)) + '</b><p>' + esc(tr(m.desc)) + '</p></div></div>';
    }).join('');

    const checklist = (tr(pr.checklist) || []).map((item, i) => {
      const done = !!st.checklist[i];
      return '<button class="check-item' + (done ? ' done' : '') + '" data-check="' + i + '" aria-pressed="' + done + '">' +
        '<span class="ci-box">' + (done ? ic('check') : '') + '</span><span>' + esc(item) + '</span></button>';
    }).join('');

    const allChecked = (tr(pr.checklist) || []).every((_, i) => st.checklist[i]);
    const canComplete = p.done === p.total && allChecked && !st.completedAt;

    root.innerHTML =
      '<a class="back-link" href="#/projects">' + ic('chevron', 'flip') + ' ' + esc(t('projects.title')) + '</a>' +
      '<div class="project-head" style="--tc:' + esc(pr.color) + '">' +
      '<span class="ph-glyph">' + ic(pr.glyph) + '</span>' +
      '<div class="ph-body"><h1>' + esc(tr(pr.title)) + '</h1>' +
      '<p>' + esc(tr(pr.summary)) + '</p>' +
      '<div class="ph-meta">' + statusBadge(status) +
      '<span class="chip">' + esc(t('course.level.' + pr.level)) + '</span>' +
      '<span class="chip">' + esc(t('domain.hours', { n: pr.estimatedHours })) + '</span>' +
      '<span class="chip gold-text">+' + pr.xp + ' XP</span></div></div>' +
      '<div class="ph-progress">' + progressBar(p.pct) + '<b>' + p.done + '/' + p.total + '</b></div></div>' +

      (missing.length
        ? '<div class="notice warn">' + ic('lock') + ' ' + esc(t('projects.needSkills', { list: missing.map(s => tr(s.title)).join(', ') })) + '</div>'
        : '') +

      '<div class="project-desc">' + tr(pr.description) + '</div>' +

      '<div class="tech-row"><span class="sr-label">' + esc(t('projects.tech')) + '</span>' +
      pr.tech.map(x => '<span class="tech-chip">' + esc(x) + '</span>').join('') + '</div>' +

      '<h2 class="section-title">' + ic('layers') + ' ' + esc(t('projects.milestones')) +
      ' <small>' + p.done + ' / ' + p.total + '</small></h2>' +
      '<div class="milestone-list">' + milestones + '</div>' +

      '<h2 class="section-title">' + ic('check') + ' ' + esc(t('projects.checklist')) + '</h2>' +
      '<p class="muted-text checklist-hint">' + esc(t('projects.checklistHint')) + '</p>' +
      '<div class="check-list">' + checklist + '</div>' +

      '<div class="project-repo">' +
      '<label class="sr-label" for="repo-url">' + esc(t('projects.repo')) + '</label>' +
      '<div class="repo-row"><input class="name-input" id="repo-url" placeholder="https://github.com/…" value="' + esc(st.repo || '') + '">' +
      '<button class="btn small secondary" id="repo-save">' + esc(t('projects.repoSave')) + '</button></div>' +
      '<p class="muted-text">' + esc(t('projects.repoHint')) + '</p></div>' +

      (st.completedAt
        ? '<div class="notice done-notice">' + ic('trophy') + ' ' + esc(t('projects.completed')) + '</div>'
        : '<div class="project-finish"><button class="btn" id="finish-btn"' + (canComplete ? '' : ' disabled') + '>' +
          ic('trophy') + ' ' + esc(t('projects.finish')) + '</button>' +
          (canComplete ? '' : '<p class="muted-text">' + esc(t('projects.finishHint')) + '</p>') + '</div>');

    /* этапы */
    root.querySelectorAll('[data-ms]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-ms');
      if (st.milestones[id]) {
        delete st.milestones[id];            // отметку можно снять — прогресс честный, а не «только вперёд»
        persist();
      } else {
        st.milestones[id] = true;
        const gained = awardMilestone(pr.id, id);
        if (gained) { toast('+' + gained + ' XP'); confetti(25); }
      }
      draw();
    }));

    /* чеклист готовности */
    root.querySelectorAll('[data-check]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.getAttribute('data-check');
      st.checklist[i] = !st.checklist[i];
      persist();
      draw();
    }));

    /* ссылка на репозиторий */
    root.querySelector('#repo-save').addEventListener('click', () => {
      st.repo = root.querySelector('#repo-url').value.trim();
      persist();
      toast(t('projects.repoSaved'));
    });

    /* завершение проекта */
    const finish = root.querySelector('#finish-btn');
    if (finish) finish.addEventListener('click', () => {
      st.completedAt = new Date().toISOString();
      const gained = awardProject(pr.id, pr.xp);
      persist();
      if (gained) toast('+' + gained + ' XP', 'gold');
      confetti(120);
      announce(t('projects.completed'));
      draw();
    });
  }

  draw();
}
