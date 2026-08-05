/**
 * admin.js — панель администратора: список пользователей и действия над ними.
 *
 * Здесь только отображение. Право что-либо делать проверяет сервер на каждом
 * запросе: спрятанная кнопка ничего не защищает, а поддельный флаг в браузере
 * ничего не даёт.
 */
import { t, tr, formatDate } from '../core/i18n.js';
import { esc, ic, toast } from '../ui.js';
import { auth, api } from '../core/state.js';

/** Давно ли человек заходил — в понятных словах, а не в метке времени. */
function ago(seconds) {
  if (!seconds) return t('admin.never');
  const days = Math.floor((Date.now() / 1000 - seconds) / 86400);
  if (days <= 0) return t('admin.today');
  if (days === 1) return t('admin.yesterday');
  return t('admin.daysAgo', { n: days });
}

export async function renderAdmin(root) {
  const me = auth();
  root.innerHTML = '<p class="loading">' + esc(t('common.loading')) + '</p>';

  let data;
  try {
    data = await api('/admin/users');
  } catch (e) {
    /* Сервер отвечает 403 всем, у кого нет прав, — это и есть настоящая защита */
    root.innerHTML = '<div class="notice warn">' + ic('lock') + ' ' + esc(t('admin.denied')) + '</div>';
    return;
  }

  const users = data.users || [];
  const admins = users.filter(u => u.is_admin).length;
  const active = users.filter(u => u.xp > 0).length;

  const row = (u) => {
    const self = me && u.username === me.username;
    return '<tr' + (self ? ' class="self"' : '') + '>' +
      '<td class="u-name"><b>' + esc(u.username) + '</b>' +
      (u.is_admin ? '<span class="tag admin">' + esc(t('admin.roleAdmin')) + '</span>' : '') +
      (self ? '<span class="tag you">' + esc(t('admin.you')) + '</span>' : '') + '</td>' +
      '<td>' + esc(formatDate(new Date(u.created * 1000).toISOString())) + '</td>' +
      '<td>' + esc(ago(u.last_seen)) + '</td>' +
      '<td class="num">' + u.xp + '</td>' +
      '<td class="num">' + u.modules + '</td>' +
      '<td class="num">' + u.streak + '</td>' +
      '<td class="u-actions">' +
      (self
        ? '<span class="muted-text small">' + esc(t('admin.selfNote')) + '</span>'
        : '<button class="btn secondary small" data-role="' + u.id + '" data-make="' + (u.is_admin ? '0' : '1') + '">' +
          esc(t(u.is_admin ? 'admin.revoke' : 'admin.grant')) + '</button>' +
          '<button class="btn secondary small" data-reset="' + u.id + '" data-name="' + esc(u.username) + '">' +
          esc(t('admin.reset')) + '</button>' +
          '<button class="btn danger small" data-del="' + u.id + '" data-name="' + esc(u.username) + '">' +
          esc(t('admin.delete')) + '</button>') +
      '</td></tr>';
  };

  root.innerHTML =
    '<div class="page-head"><h1>' + ic('shield') + ' ' + esc(t('admin.title')) + '</h1>' +
    '<p>' + esc(t('admin.subtitle')) + '</p></div>' +

    '<section class="stat-row">' +
    '<div class="stat-tile"><b>' + users.length + '</b><span>' + esc(t('admin.statUsers')) + '</span></div>' +
    '<div class="stat-tile"><b>' + active + '</b><span>' + esc(t('admin.statActive')) + '</span></div>' +
    '<div class="stat-tile"><b>' + admins + '</b><span>' + esc(t('admin.statAdmins')) + '</span></div>' +
    '<div class="stat-tile"><b>' + users.reduce((s, u) => s + u.xp, 0) + '</b><span>' + esc(t('admin.statXp')) + '</span></div>' +
    '</section>' +

    '<div class="table-wrap"><table class="admin-table">' +
    '<thead><tr>' +
    '<th>' + esc(t('admin.colUser')) + '</th>' +
    '<th>' + esc(t('admin.colCreated')) + '</th>' +
    '<th>' + esc(t('admin.colSeen')) + '</th>' +
    '<th class="num">XP</th>' +
    '<th class="num">' + esc(t('admin.colModules')) + '</th>' +
    '<th class="num">' + esc(t('admin.colStreak')) + '</th>' +
    '<th>' + esc(t('admin.colActions')) + '</th>' +
    '</tr></thead><tbody>' + users.map(row).join('') + '</tbody></table></div>' +

    '<p class="muted-text small admin-note">' + ic('info') + ' ' + esc(t('admin.serverNote')) + '</p>';

  /* ---------- действия ---------- */
  const reload = () => renderAdmin(root);

  root.querySelectorAll('[data-role]').forEach(btn => btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await api('/admin/user/' + btn.getAttribute('data-role') + '/role', 'POST',
        { is_admin: btn.getAttribute('data-make') === '1' });
      toast(t('admin.roleChanged'));
      reload();
    } catch (e) {
      toast(e.message || t('admin.failed'), 'err');
      btn.disabled = false;
    }
  }));

  /* Необратимые действия — только после явного подтверждения с именем */
  root.querySelectorAll('[data-reset]').forEach(btn => btn.addEventListener('click', async () => {
    const name = btn.getAttribute('data-name');
    if (!window.confirm(t('admin.confirmReset', { name }))) return;
    btn.disabled = true;
    try {
      await api('/admin/user/' + btn.getAttribute('data-reset') + '/reset', 'POST', {});
      toast(t('admin.resetDone', { name }));
      reload();
    } catch (e) {
      toast(e.message || t('admin.failed'), 'err');
      btn.disabled = false;
    }
  }));

  root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    const name = btn.getAttribute('data-name');
    if (!window.confirm(t('admin.confirmDelete', { name }))) return;
    btn.disabled = true;
    try {
      await api('/admin/user/' + btn.getAttribute('data-del'), 'DELETE');
      toast(t('admin.deleted', { name }));
      reload();
    } catch (e) {
      toast(e.message || t('admin.failed'), 'err');
      btn.disabled = false;
    }
  }));
}
