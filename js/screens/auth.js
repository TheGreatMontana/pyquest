/** auth.js — экран входа и регистрации + перенос локального прогресса в аккаунт. */
import { t, tr } from '../core/i18n.js';
import { esc, ic, toast } from '../ui.js';
import * as S from '../core/state.js';
import { checkAchievements } from '../core/gamification.js';

let onSuccess = null;
export function setAuthCallback(fn) { onSuccess = fn; }

export function renderAuth(root, mode) {
  const local = S.loadLocal();
  const lastUser = S.lastUser();
  const localXp = local && local.xp ? local.xp : 0;
  const showMigrationBanner = localXp > 0 && !lastUser;   // прогресс до эпохи аккаунтов
  const isReg = mode === 'register';

  root.innerHTML =
    '<div class="auth-wrap"><div class="auth-card">' +
    '<div class="auth-logo"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0ea5e9"/><path d="M8 20l5-5 4 3 7-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '<h1>Py<b>Quest</b></h1>' +
    '<p class="auth-sub">' + esc(t('auth.subtitle')) + '</p>' +
    '<div class="auth-tabs" role="tablist">' +
    '<button class="auth-tab' + (!isReg ? ' active' : '') + '" role="tab" aria-selected="' + !isReg + '" data-mode="login">' + esc(t('auth.login')) + '</button>' +
    '<button class="auth-tab' + (isReg ? ' active' : '') + '" role="tab" aria-selected="' + isReg + '" data-mode="register">' + esc(t('auth.register')) + '</button></div>' +
    (showMigrationBanner
      ? '<div class="auth-banner">' + ic('zap') + '<span>' + esc(t('auth.localFound', { xp: localXp })) + '</span></div>'
      : '') +
    '<form id="auth-form" autocomplete="on">' +
    '<label class="auth-field" for="auth-user">' + esc(t('auth.username')) +
    '<input id="auth-user" name="username" type="text" autocomplete="username" placeholder="' + esc(t('auth.usernamePlaceholder')) + '" maxlength="20" required></label>' +
    '<label class="auth-field" for="auth-pass">' + esc(t('auth.password')) +
    '<input id="auth-pass" name="password" type="password" autocomplete="' + (isReg ? 'new-password' : 'current-password') + '" placeholder="' + esc(t('auth.passwordPlaceholder')) + '" minlength="6" required></label>' +
    '<div class="auth-error" id="auth-error" role="alert" hidden></div>' +
    '<button class="btn auth-submit" type="submit" id="auth-submit">' + esc(t(isReg ? 'auth.submitRegister' : 'auth.submitLogin')) + '</button>' +
    '</form>' +
    '<p class="auth-hint">' + esc(t(isReg ? 'auth.hintRegister' : 'auth.hintLogin')) + '</p>' +
    '</div></div>';

  root.querySelectorAll('.auth-tab').forEach(tab =>
    tab.addEventListener('click', () => renderAuth(root, tab.getAttribute('data-mode'))));

  root.querySelector('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = root.querySelector('#auth-submit');
    const errEl = root.querySelector('#auth-error');
    const username = root.querySelector('#auth-user').value.trim();
    const password = root.querySelector('#auth-pass').value;
    errEl.hidden = true;
    btn.disabled = true;
    btn.textContent = t('auth.working');
    try {
      const res = await S.api(isReg ? '/register' : '/login', 'POST', { username, password });
      await completeAuth(res.username, res.token);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = t(isReg ? 'auth.submitRegister' : 'auth.submitLogin');
    }
  });

  setTimeout(() => { const u = root.querySelector('#auth-user'); if (u) u.focus(); }, 60);
}

/**
 * Вход состоялся: выбираем более полное состояние (локальное или серверное),
 * мигрируем схему и сразу отправляем результат на сервер.
 */
export async function completeAuth(username, token) {
  S.setAuth({ token, username });

  const prevUser = S.lastUser();
  let localRaw = S.loadLocal();
  if (prevUser && prevUser.toLowerCase() !== username.toLowerCase()) {
    localRaw = null;                       // на устройстве занимался другой человек
    S.clearLocal();
  }
  S.setLastUser(username);

  let remoteRaw = null;
  try { remoteRaw = (await S.api('/state')).state; } catch (e) { /* оффлайн — работаем локально */ }

  const local = localRaw ? S.migrate(localRaw) : null;
  const remote = remoteRaw ? S.migrate(remoteRaw) : null;
  const chosen = S.stateScore(local) >= S.stateScore(remote) ? local : remote;

  S.setState(chosen || S.freshState());
  checkAchievements();
  try { await S.pushState(); } catch (e) { /* синк повторится позже */ }

  toast(t('auth.welcome', { name: esc(username) }));
  if (onSuccess) onSuccess();
}

export async function doLogout() {
  try { await S.pushState(); } catch (e) { /* не критично */ }
  try { await S.api('/logout', 'POST'); } catch (e) { /* не критично */ }
  S.setAuth(null);
  S.clearLocal();
}
