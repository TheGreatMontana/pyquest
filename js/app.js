/**
 * app.js — точка входа: инициализация, роутер, шапка.
 *
 * Порядок старта: язык → каталог → авторизация → состояние → экран.
 */
import { initI18n, t, tr, getLang, setLang, languages, onLangChange } from './core/i18n.js';
import { loadCatalog, getCatalog } from './core/content.js';
import * as S from './core/state.js';
import { rank, nextRank, onXp, onAchievement, checkAchievements, noteLanguage } from './core/gamification.js';
import { esc, ic, toast, confetti } from './ui.js';
import { renderAuth, setAuthCallback, doLogout } from './screens/auth.js';
import { renderDashboard } from './screens/dashboard.js';
import { renderCatalog, renderDomain } from './screens/catalog.js';
import { renderCourse, renderModule, initBookmarks } from './screens/course.js';
import { renderExam, stopExam } from './screens/exam.js';
import { renderRoadmap, renderPractice, renderAssessment, renderCertificate } from './screens/misc.js';
import { renderProjects, renderProject } from './screens/projects.js';
import { renderAdmin } from './screens/admin.js';

const app = document.getElementById('app');

/* ---------- шапка ---------- */
function updateTopbar() {
  const st = S.state();
  const auth = S.auth();
  const r = rank();
  document.querySelector('#stat-streak b').textContent = st.streak || 0;
  document.querySelector('#stat-xp b').textContent = st.xp || 0;
  document.getElementById('stat-rank').textContent = tr(r.title);

  const userChip = document.getElementById('stat-user');
  const logoutBtn = document.getElementById('logout-btn');
  userChip.hidden = !auth;
  logoutBtn.hidden = !auth;
  if (auth) userChip.querySelector('b').textContent = auth.username;

  document.querySelector('.topnav').hidden = !auth;
  /* Ссылку видно только администратору. Это удобство, а не защита:
     доступ к данным всё равно решает сервер на каждом запросе. */
  const adminLink = document.getElementById('nav-admin');
  if (adminLink) adminLink.hidden = !(auth && auth.is_admin);
  document.getElementById('stat-streak').hidden = !auth;
  document.getElementById('stat-xp').hidden = !auth;
  document.getElementById('stat-rank').hidden = !auth;
}

function renderLangSwitcher() {
  const el = document.getElementById('lang-switch');
  const cur = getLang();
  el.innerHTML = languages().map(l =>
    '<button class="lang-opt' + (l === cur ? ' active' : '') + '" data-lang="' + l + '" ' +
    'aria-pressed="' + (l === cur) + '" title="' + esc(t('topbar.language')) + '">' + l.toUpperCase() + '</button>').join('');
  el.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', async () => {
    await setLang(b.getAttribute('data-lang'));
  }));
}

function applyStaticLabels() {
  document.querySelector('[data-i18n="nav.map"]').textContent = t('nav.map');
  document.querySelector('[data-i18n="nav.catalog"]').textContent = t('nav.catalog');
  document.querySelector('[data-i18n="nav.practice"]').textContent = t('nav.practice');
  document.querySelector('[data-i18n="nav.projects"]').textContent = t('nav.projects');
  document.querySelector('[data-i18n="nav.roadmap"]').textContent = t('nav.roadmap');
  const na = document.querySelector('[data-i18n="nav.admin"]');
  if (na) na.textContent = t('nav.admin');
  document.querySelector('.footer p').innerHTML = esc(t('footer.text')) +
    ' · <a href="https://github.com/TheGreatMontana/pyquest" target="_blank" rel="noopener">GitHub</a>';
  document.getElementById('stat-streak').title = t('topbar.streak');
  document.getElementById('stat-xp').title = t('topbar.xp');
  document.getElementById('stat-rank').title = t('topbar.rank');
  document.getElementById('stat-user').title = t('topbar.account');
  document.getElementById('logout-btn').title = t('topbar.logout');
}

/* ---------- роутер ---------- */
function parseHash() {
  return (location.hash.slice(2) || '').split('/').filter(Boolean);
}

async function route() {
  stopExam();
  if (!S.auth()) { renderAuth(app, 'login'); updateTopbar(); return; }

  const p = parseHash();
  window.scrollTo(0, 0);
  try {
    if (p[0] === 'catalog') return renderCatalog(app);
    if (p[0] === 'domain' && p[1]) return renderDomain(app, p[1]);
    if (p[0] === 'admin') return await renderAdmin(app);
    if (p[0] === 'roadmap') return renderRoadmap(app);
    if (p[0] === 'practice') return await renderPractice(app);
    if (p[0] === 'projects') return await renderProjects(app);
    if (p[0] === 'project' && p[1]) return await renderProject(app, p[1]);
    if (p[0] === 'assess' && p[1]) return await renderAssessment(app, p[1]);
    if (p[0] === 'cert' && p[1]) return renderCertificate(app, p[1]);
    if (p[0] === 'course' && p[1]) {
      const courseId = p[1];
      if (p[2] === 'final') return await renderExam(app, courseId, null);
      if (p[2] === 'module' && p[3]) {
        const moduleId = p[3];
        const tab = p[4] || 'theory';
        if (tab === 'exam') return await renderExam(app, courseId, moduleId);
        return await renderModule(app, courseId, moduleId, tab, p[5]);
      }
      return await renderCourse(app, courseId);
    }
    return renderDashboard(app);
  } catch (e) {
    console.error('[route]', e);
    app.innerHTML = '<div class="notice warn">' + ic('alert') + ' ' + esc(t('common.error')) + ': ' + esc(e.message) +
      ' <button class="btn small secondary" onclick="location.reload()">' + esc(t('common.retry')) + '</button></div>';
  }
}

window.addEventListener('hashchange', route);

/* ---------- события геймификации ---------- */
onAchievement(a => {
  toast(a.icon + ' ' + esc(tr(a.title)), 'gold');
  confetti(40);
  updateTopbar();
});
onXp(() => updateTopbar());

S.onSyncError(() => {
  S.setAuth(null);
  toast(t('auth.expired'));
  renderAuth(app, 'login');
  updateTopbar();
});

/* ---------- смена языка перерисовывает всё ---------- */
onLangChange(() => {
  noteLanguage(getLang());
  applyStaticLabels();
  renderLangSwitcher();
  updateTopbar();
  route();
});

/* ---------- запуск ---------- */
setAuthCallback(() => {
  updateTopbar();
  if (location.hash && location.hash !== '#/') location.hash = '#/';
  else route();
});

async function boot() {
  await initI18n();
  applyStaticLabels();
  renderLangSwitcher();
  initBookmarks(app);          // делегирование переживает перерисовку экранов

  try {
    await loadCatalog();
  } catch (e) {
    app.innerHTML = '<div class="notice warn">' + ic('alert') + ' ' + esc(e.message) + '</div>';
    return;
  }

  S.loadAuth();
  S.initSync();
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await doLogout();
    updateTopbar();
    location.hash = '#/';
    renderAuth(app, 'login');
  });

  if (!S.auth()) { updateTopbar(); renderAuth(app, 'login'); return; }

  /* Загружаем состояние: сервер или локальный кэш, что полнее */
  const localRaw = S.loadLocal();
  let remoteRaw = null;
  try {
    remoteRaw = (await S.api('/state')).state;
  } catch (e) {
    if (e.unauthorized) { S.setAuth(null); updateTopbar(); renderAuth(app, 'login'); return; }
    toast(t('auth.offline'));
  }
  const local = localRaw ? S.migrate(localRaw) : null;
  const remote = remoteRaw ? S.migrate(remoteRaw) : null;
  const chosen = S.stateScore(local) >= S.stateScore(remote) ? local : remote;
  S.setState(chosen || S.freshState());

  if (chosen && chosen.migratedModules) {
    console.info('[migration] перенесено модулей:', chosen.migratedModules);
  }
  noteLanguage(getLang());
  checkAchievements();
  updateTopbar();
  route();
}

boot();
