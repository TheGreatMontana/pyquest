/* ===== PyQuest — движок приложения (треки Python / SQL / Алгоритмы) ===== */
(function () {
  'use strict';

  /* ---------- Состояние ---------- */
  const KEY = 'pyquest_v1';
  const DEF = { xp: 0, streak: 0, lastDay: null, start: null, name: '', mods: {}, ach: [], finalBest: 0, rm: {} };
  let S = load();

  function load() {
    try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return Object.assign({}, DEF); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
  function mod(id) {
    if (!S.mods[id]) S.mods[id] = { theory: false, quizBest: 0, tasks: {}, examBest: 0, examPerfect: false };
    return S.mods[id];
  }
  function dstr(d) { return d.toISOString().slice(0, 10); }
  function today() { return dstr(new Date()); }
  if (!S.start) { S.start = today(); save(); }

  const moduleById = {};
  COURSE.modules.forEach(m => { moduleById[m.id] = m; });
  const trackById = {};
  COURSE.tracks.forEach(t => { trackById[t.id] = t; });

  /* ---------- XP, стрик, ранги ---------- */
  function rank() {
    let r = COURSE.ranks[0];
    for (const x of COURSE.ranks) if (S.xp >= x.xp) r = x;
    return r;
  }
  function nextRank() { return COURSE.ranks.find(r => r.xp > S.xp) || null; }

  function addXP(n, silent) {
    if (n <= 0) return;
    S.xp += n;
    const t = today();
    if (S.lastDay !== t) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      S.streak = (S.lastDay === dstr(y)) ? S.streak + 1 : 1;
      S.lastDay = t;
    }
    save();
    if (!silent) toast('+' + n + ' XP');
    checkAch();
    topbar();
  }

  /* ---------- Прогресс ---------- */
  function isCompleted(id) {
    const m = mod(id), data = COURSE_DATA[id];
    if (!data) return false;
    const allTasks = data.tasks.every(t => m.tasks[t.id]);
    return m.theory && m.quizBest >= 70 && allTasks && m.examBest >= 70;
  }
  function trackDone(trackId) {
    return trackById[trackId].modules.every(id => isCompleted(id));
  }
  function isUnlocked(id) {
    const m = moduleById[id];
    const track = trackById[m.track];
    if (track.needs && mod(track.needs).examBest < 70) return false;
    const idx = track.modules.indexOf(id);
    if (idx === 0) return true;
    return mod(track.modules[idx - 1]).examBest >= 70;
  }
  function finalUnlocked() { return trackById.py.modules.every(id => mod(id).examBest >= 70); }
  function solvedTasks(prefix) {
    let n = 0;
    for (const id in S.mods) {
      if (prefix && id[0] !== prefix) continue;
      n += Object.keys(S.mods[id].tasks || {}).length;
    }
    return n;
  }

  /* ---------- Ачивки ---------- */
  function checkAch() {
    const passedAny = COURSE.modules.some(m => mod(m.id).examBest >= 70);
    const completedAll = COURSE.modules.filter(m => isCompleted(m.id)).length;
    const cond = {
      'first-code': solvedTasks() >= 1,
      'quiz-perfect': Object.values(S.mods).some(m => m.quizBest >= 100),
      'boss-1': passedAny,
      'streak-3': S.streak >= 3,
      'streak-7': S.streak >= 7,
      'sql-first': solvedTasks('s') >= 1,
      'half-way': completedAll >= 10,
      'exam-perfect': Object.values(S.mods).some(m => m.examPerfect),
      'xp-1000': S.xp >= 1000,
      'all-tasks': solvedTasks() >= 30,
      'py-track': trackDone('py') && S.finalBest >= 70,
      'sql-track': trackDone('sql'),
      'algo-track': trackDone('algo'),
    };
    for (const a of COURSE.achievements) {
      if (cond[a.id] && !S.ach.includes(a.id)) {
        S.ach.push(a.id);
        save();
        toast(a.icon + ' Достижение: <b>' + a.name + '</b>', 'gold');
        confetti(40);
      }
    }
  }

  /* ---------- Утилиты UI ---------- */
  const app = document.getElementById('app');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function ic(name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>'; }

  function hlPy(src) {
    let s = esc(src);
    const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(\d+(?:\.\d+)?)\b|\b(def|return|if|elif|else|for|while|in|not|and|or|import|from|as|class|try|except|finally|with|pass|break|continue|True|False|None|lambda|is|del|raise|global|yield|self)\b|\b(print|input|len|range|type|int|str|float|bool|list|dict|set|open|sum|min|max|sorted|enumerate|round|abs|zip|isinstance|super|deque)\b/g;
    return s.replace(re, (m, com, str, num, kw, fn) => {
      if (com) return '<span class="py-com">' + com + '</span>';
      if (str) return '<span class="py-str">' + str + '</span>';
      if (num) return '<span class="py-num">' + num + '</span>';
      if (kw) return '<span class="py-kw">' + kw + '</span>';
      if (fn) return '<span class="py-fn">' + fn + '</span>';
      return m;
    });
  }
  function hlSql(src) {
    let s = esc(src);
    const re = /(--[^\n]*)|('(?:[^'\n])*')|\b(\d+(?:\.\d+)?)\b|\b(SELECT|FROM|WHERE|ORDER|GROUP|BY|HAVING|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|DISTINCT|LIMIT|TOP|CASE|WHEN|THEN|ELSE|END|CREATE|TABLE|INSERT|INTO|VALUES|UPDATE|DELETE|SET|WITH|OVER|PARTITION|UNION|ALL|EXCEPT|INTERSECT|PRIMARY|FOREIGN|KEY|REFERENCES|DEFAULT|CHECK|UNIQUE|IDENTITY|INTEGER|TEXT|REAL|INT|NVARCHAR|DECIMAL|DATE|ASC|DESC|PRAGMA)\b|\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|LEN|ROUND|CAST|COALESCE|ISNULL|SUBSTR|SUBSTRING|REPLACE|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|NTILE|STRFTIME|GETDATE|YEAR|MONTH|DAY|DATEDIFF|DATEADD|CONCAT)\b/gi;
    return s.replace(re, (m, com, str, num, kw, fn) => {
      if (com) return '<span class="py-com">' + com + '</span>';
      if (str) return '<span class="py-str">' + str + '</span>';
      if (num) return '<span class="py-num">' + num + '</span>';
      if (kw) return '<span class="py-kw">' + m + '</span>';
      if (fn) return '<span class="py-fn">' + m + '</span>';
      return m;
    });
  }
  function codeBlock(code, lang) {
    return '<pre class="code"><code>' + (lang === 'sql' ? hlSql(code) : hlPy(code)) + '</code></pre>';
  }

  function toast(html, cls) {
    const layer = document.getElementById('toast-layer');
    const el = document.createElement('div');
    el.className = 'toast' + (cls ? ' ' + cls : '');
    el.innerHTML = html;
    layer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(() => el.remove(), 3100);
  }

  function confetti(n) {
    const layer = document.getElementById('confetti-layer');
    const colors = ['#34d399', '#38bdf8', '#fbbf24', '#a78bfa', '#f87171', '#f472b6'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = (1.6 + Math.random() * 1.8) + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      layer.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  function topbar() {
    const r = rank();
    document.querySelector('#stat-streak b').textContent = S.streak;
    document.querySelector('#stat-xp b').textContent = S.xp;
    document.getElementById('stat-rank').textContent = r.name;
  }

  /* ---------- Редактор: Tab = 4 пробела ---------- */
  function bindEditor(ed, saveKey) {
    ed.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ed.selectionStart;
        ed.value = ed.value.slice(0, s) + '    ' + ed.value.slice(ed.selectionEnd);
        ed.selectionStart = ed.selectionEnd = s + 4;
      }
    });
    if (saveKey) ed.addEventListener('input', () => localStorage.setItem(saveKey, ed.value));
  }

  /* ---------- Роутер ---------- */
  let examSession = null;

  function route() {
    if (examSession && examSession.timer) clearInterval(examSession.timer);
    examSession = null;
    const parts = (location.hash.slice(2) || '').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    if (parts[0] === 'm' && parts[1]) {
      const id = parts[1];
      if (!moduleById[id] || !COURSE_DATA[id]) return renderDash();
      if (!isUnlocked(id)) {
        const tr = trackById[moduleById[id].track];
        toast(tr.needs && mod(tr.needs).examBest < 70 && tr.modules[0] === id ? (tr.needsText || 'Модуль пока закрыт') : 'Сначала сдай экзамен предыдущего модуля');
        location.hash = '#/'; return;
      }
      if (parts[2] === 'task' && parts[3]) return renderTask(id, parts[3]);
      return renderModule(id, parts[2] || 'theory');
    }
    if (parts[0] === 'final') {
      if (!finalUnlocked()) { toast('Финал откроется после всех экзаменов Python-трека'); location.hash = '#/'; return; }
      return renderExam('final', COURSE_DATA.final, true);
    }
    if (parts[0] === 'roadmap') return renderRoadmap();
    if (parts[0] === 'cert') return renderCert();
    renderDash();
  }
  window.addEventListener('hashchange', route);

  /* ---------- Главная ---------- */
  function dayIndex() {
    const start = new Date(S.start + 'T00:00:00');
    return Math.max(1, Math.floor((new Date() - start) / 86400000) + 1);
  }

  function nextTarget() {
    for (const t of COURSE.tracks) {
      for (const id of t.modules) {
        if (isUnlocked(id) && !isCompleted(id)) return { href: '#/m/' + id, text: 'Продолжить: ' + moduleById[id].title };
      }
    }
    if (finalUnlocked() && S.finalBest < 70) return { href: '#/final', text: 'Финальный экзамен Python' };
    if (S.finalBest >= 70) return { href: '#/cert', text: 'Мой сертификат' };
    return { href: '#/', text: 'Продолжить' };
  }

  function trackSection(t) {
    const done = t.modules.filter(id => isCompleted(id)).length;
    const pct = Math.round((done / t.modules.length) * 100);
    const locked = t.needs && mod(t.needs).examBest < 70;
    let rows = '';
    t.modules.forEach((id, i) => {
      const m = moduleById[id], st = mod(id), data = COURSE_DATA[id];
      const unlocked = isUnlocked(id), completed = isCompleted(id);
      const tasksDone = data.tasks.filter(x => st.tasks[x.id]).length;
      rows += '<div class="mod-row' + (unlocked ? '' : ' locked') + (completed ? ' completed' : '') + '" data-go="' + (unlocked ? '#/m/' + id : '') + '">' +
        '<div class="mod-num" style="--tc:' + t.color + '">' + (completed ? ic('check') : String(m.num).padStart(2, '0')) + '</div>' +
        '<div class="mod-info"><h4>' + m.title + '</h4><p>' + m.tagline + '</p></div>' +
        '<div class="mod-chips">' +
        '<span class="chip' + (st.theory ? ' ok' : '') + '">' + ic('book') + ' теория</span>' +
        '<span class="chip' + (st.quizBest >= 70 ? ' ok' : '') + '">' + ic('target') + ' ' + st.quizBest + '%</span>' +
        '<span class="chip' + (tasksDone === data.tasks.length ? ' ok' : '') + '">' + ic('terminal') + ' ' + tasksDone + '/' + data.tasks.length + '</span>' +
        '<span class="chip' + (st.examBest >= 70 ? ' ok' : '') + '">' + ic('shield') + ' ' + st.examBest + '%</span>' +
        '</div>' +
        '<span class="mod-state">' + (completed ? ic('check', 'ok') : (unlocked ? ic('chevron') : ic('lock', 'muted'))) + '</span></div>';
    });
    let extra = '';
    if (t.id === 'py') {
      const fUn = finalUnlocked();
      extra = '<div class="mod-row final-row' + (fUn ? '' : ' locked') + (S.finalBest >= 70 ? ' completed' : '') + '" data-go="' + (fUn ? '#/final' : '') + '">' +
        '<div class="mod-num" style="--tc:#fbbf24">' + ic('trophy') + '</div>' +
        '<div class="mod-info"><h4>Финальный экзамен</h4><p>Всё, что выучил в Python-треке + сертификат</p></div>' +
        (S.finalBest ? '<div class="mod-chips"><span class="chip' + (S.finalBest >= 70 ? ' ok' : '') + '">' + S.finalBest + '%</span></div>' : '') +
        '<span class="mod-state">' + (S.finalBest >= 70 ? ic('check', 'ok') : (fUn ? ic('chevron') : ic('lock', 'muted'))) + '</span></div>';
    }
    return '<section class="track" style="--tc:' + t.color + '">' +
      '<div class="track-head">' +
      '<div class="track-glyph">' + ic(t.glyph) + '</div>' +
      '<div class="track-title"><h2>' + t.name + '</h2><p>' + t.desc + '</p></div>' +
      '<div class="track-progress"><span>' + done + '/' + t.modules.length + '</span>' +
      '<div class="pbar"><div style="width:' + pct + '%"></div></div></div></div>' +
      (locked ? '<p class="track-locked">' + ic('lock') + ' ' + (t.needsText || 'Трек пока закрыт') + '</p>' : '') +
      '<div class="mod-list">' + rows + extra + '</div></section>';
  }

  function renderDash() {
    const r = rank(), nr = nextRank();
    const pct = nr ? Math.round(((S.xp - r.xp) / (nr.xp - r.xp)) * 100) : 100;
    const day = dayIndex();
    const week = Math.min(Math.ceil(day / 7), COURSE.plan.length);
    const wk = COURSE.plan[week - 1];
    const nt = nextTarget();

    let planHtml = '';
    COURSE.plan.forEach(p => {
      const cls = p.week === week ? ' current' : (p.week < week ? ' past' : '');
      planHtml += '<div class="plan-week' + cls + '"><div class="pw-head"><span class="pw-num">Неделя ' + p.week + '</span>' +
        (p.week === week ? '<span class="pw-now">ты здесь</span>' : '') + '<b>' + p.title + '</b></div>' +
        '<ul>' + p.items.map(x => '<li>' + x + '</li>').join('') + '</ul></div>';
    });

    let ach = '';
    COURSE.achievements.forEach(a => {
      const un = S.ach.includes(a.id);
      ach += '<div class="ach ' + (un ? 'unlocked' : 'locked') + '"><span class="ico">' + a.icon + '</span><b>' + a.name + '</b><span class="desc">' + a.desc + '</span></div>';
    });

    app.innerHTML =
      '<div class="hero"><div class="hero-main">' +
      '<p class="hero-kicker">Путь Data Engineer · неделя ' + week + ' из ' + COURSE.plan.length + '</p>' +
      '<h1>Python · SQL · Алгоритмы</h1>' +
      '<p class="sub">Интерактивная программа по плану твоего ментора: 20 модулей, тренажёры Python и SQL прямо в браузере, экзамены и понятный роадмап до первой работы.</p>' +
      '<div class="xp-bar-wrap"><div class="xp-bar-label"><span>' + ic('star') + ' ' + r.name + '</span><span>' +
      (nr ? S.xp + ' / ' + nr.xp + ' XP до «' + nr.name + '»' : S.xp + ' XP — максимум') + '</span></div>' +
      '<div class="xp-bar"><div style="width:' + pct + '%"></div></div></div>' +
      '<div class="hero-actions"><a class="btn" href="' + nt.href + '">' + ic('play') + ' ' + nt.text + '</a>' +
      '<a class="btn ghost" href="#/roadmap">' + ic('map') + ' Роадмап</a></div>' +
      '</div>' +
      '<aside class="hero-side"><h3>' + ic('calendar') + ' Эта неделя: ' + wk.title + '</h3>' +
      '<ul>' + wk.items.map(x => '<li>' + x + '</li>').join('') + '</ul></aside></div>' +
      COURSE.tracks.map(trackSection).join('') +
      '<h2 class="section-title">' + ic('calendar') + ' План на 6 недель <small>старт ' + new Date(S.start + 'T00:00:00').toLocaleDateString('ru-RU') + '</small></h2>' +
      '<div class="plan-grid">' + planHtml + '</div>' +
      '<h2 class="section-title">' + ic('medal') + ' Достижения <small>' + S.ach.length + ' / ' + COURSE.achievements.length + '</small></h2>' +
      '<div class="ach-grid">' + ach + '</div>';

    app.querySelectorAll('[data-go]').forEach(el => {
      el.addEventListener('click', () => {
        const go = el.getAttribute('data-go');
        if (go) location.hash = go;
        else toast('Сначала сдай экзамен предыдущего модуля');
      });
    });
  }

  /* ---------- Роадмап ---------- */
  function renderRoadmap() {
    const doneOnSite = [
      { text: 'Python: основы языка (плейлист друга → трек Python)', done: trackDone('py') },
      { text: 'SQL: Week 1–4 ментора → трек SQL с тренажёром', done: trackDone('sql') },
      { text: 'Алгоритмы: «Грокаем алгоритмы» гл. 1–6 → трек Алгоритмы', done: trackDone('algo') },
    ];
    let html = '<a class="back-link" href="#/">' + ic('chevron', 'flip') + ' На главную</a>' +
      '<div class="page-head"><h1>' + ic('map') + ' Роадмап Data Engineer</h1>' +
      '<p>Всё, что расписал твой ментор (Аслон Ака) в переписке и файлах — ничего не потеряно. Треки проходишь на сайте, остальное отмечай галочками по мере изучения.</p></div>';

    html += '<section class="rm-section"><h2>Проходится на этом сайте</h2><div class="rm-list">' +
      doneOnSite.map(x => '<div class="rm-item static' + (x.done ? ' done' : '') + '">' +
        '<span class="rm-check">' + (x.done ? ic('check') : '') + '</span><span>' + x.text + '</span></div>').join('') + '</div></section>';

    COURSE.roadmap.forEach(sec => {
      html += '<section class="rm-section"><h2>' + sec.title + '</h2><div class="rm-list">' +
        sec.items.map(it => {
          const done = !!S.rm[it.id];
          return '<div class="rm-item' + (done ? ' done' : '') + '" data-rm="' + it.id + '">' +
            '<span class="rm-check">' + (done ? ic('check') : '') + '</span>' +
            '<span class="rm-text">' + it.text +
            (it.link ? ' <a href="' + it.link + '" target="_blank" rel="noopener" class="rm-link">' + ic('external') + ' открыть</a>' : '') +
            '</span></div>';
        }).join('') + '</div></section>';
    });

    html += '<section class="rm-section"><h2>Плейлисты из переписки</h2><div class="rm-list">' +
      COURSE.mentorLinks.map(l => '<div class="rm-item static"><span class="rm-check"></span><span>' + l.text +
        ' <a href="' + l.link + '" target="_blank" rel="noopener" class="rm-link">' + ic('external') + ' открыть</a></span></div>').join('') +
      '</div><p class="rm-note">Книги и файлы упражнений (T-SQL Fundamentals, Грокаем алгоритмы, Week 1–4, SQL Practice Problems) лежат у тебя в папке <b>ChatExport_2026-07-27/files</b>.</p></section>';

    app.innerHTML = html;
    app.querySelectorAll('[data-rm]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-rm');
        S.rm[id] = !S.rm[id];
        save();
        renderRoadmap();
      });
    });
  }

  /* ---------- Страница модуля ---------- */
  function modHeader(id, tab) {
    const m = moduleById[id];
    const t = trackById[m.track];
    const st = mod(id);
    const data = COURSE_DATA[id];
    const tasksDone = data.tasks.filter(x => st.tasks[x.id]).length;
    const tabs = [
      ['theory', ic('book') + ' Теория', st.theory],
      ['quiz', ic('target') + ' Квиз', st.quizBest >= 70],
      ['tasks', ic('terminal') + ' Задачи', tasksDone === data.tasks.length],
      ['exam', ic('shield') + ' Экзамен', st.examBest >= 70],
    ];
    return '<a class="back-link" href="#/">' + ic('chevron', 'flip') + ' Карта курса</a>' +
      '<div class="mod-header" style="--tc:' + t.color + '"><div class="mod-num big">' + String(m.num).padStart(2, '0') + '</div>' +
      '<div><p class="mod-track">' + t.name + ' · модуль ' + m.num + ' из ' + t.modules.length + '</p><h1>' + m.title + '</h1><p class="mod-tagline">' + m.tagline + '</p></div></div>' +
      '<div class="tabs">' + tabs.map(x =>
        '<div class="tab' + (tab === x[0] ? ' active' : '') + '" data-tab="' + x[0] + '">' + x[1] +
        (x[2] ? ' <span class="done-mark">' + ic('check') + '</span>' : '') + '</div>').join('') + '</div>';
  }

  function renderModule(id, tab) {
    if (tab === 'quiz') return renderQuiz(id);
    if (tab === 'tasks') return renderTasks(id);
    if (tab === 'exam') return renderExam(id, COURSE_DATA[id].exam, false);
    renderTheory(id);
  }
  function bindTabs(id) {
    app.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
      location.hash = '#/m/' + id + '/' + t.getAttribute('data-tab');
    }));
  }

  /* ---------- Теория ---------- */
  function renderTheory(id) {
    const data = COURSE_DATA[id];
    const st = mod(id);
    let idx = 0;

    function draw() {
      const card = data.theory[idx];
      let body = '';
      for (const b of card.blocks) {
        if (typeof b === 'string') body += b;
        else if (b.code) body += codeBlock(b.code, 'py');
        else if (b.sql) body += codeBlock(b.sql, 'sql');
        else if (b.run) body += codeBlock(b.run, 'py') +
          '<div class="try-box"><button class="btn small blue" data-run="py">' + ic('play') + ' Запустить пример</button><div class="try-out" style="display:none"></div></div>';
        else if (b.sqlrun) body += codeBlock(b.sqlrun, 'sql') +
          '<div class="try-box"><button class="btn small blue" data-run="sql">' + ic('play') + ' Выполнить запрос</button><div class="try-out" style="display:none"></div></div>';
      }
      app.innerHTML = modHeader(id, 'theory') +
        '<div class="theory-card"><h2>' + card.title + '</h2>' + body +
        '<div class="theory-nav">' +
        '<button class="btn secondary" id="th-prev" ' + (idx === 0 ? 'disabled' : '') + '>← Назад</button>' +
        '<span class="theory-progress">' + (idx + 1) + ' / ' + data.theory.length + '</span>' +
        (idx < data.theory.length - 1
          ? '<button class="btn" id="th-next">Дальше →</button>'
          : '<button class="btn" id="th-done">' + (st.theory ? 'К квизу' : 'Завершить теорию') + '</button>') +
        '</div></div>';
      bindTabs(id);
      const prev = document.getElementById('th-prev');
      if (prev) prev.addEventListener('click', () => { idx--; draw(); });
      const nx = document.getElementById('th-next');
      if (nx) nx.addEventListener('click', () => { idx++; draw(); });
      const dn = document.getElementById('th-done');
      if (dn) dn.addEventListener('click', () => {
        if (!st.theory) { st.theory = true; save(); addXP(COURSE.xpRewards.theory); confetti(30); }
        location.hash = '#/m/' + id + '/quiz';
      });
      const runBlocks = card.blocks.filter(b => b && (b.run || b.sqlrun));
      app.querySelectorAll('[data-run]').forEach((btn, bi) => {
        btn.addEventListener('click', async () => {
          const block = runBlocks[bi];
          const out = btn.parentElement.querySelector('.try-out');
          out.style.display = 'block';
          out.textContent = 'Выполняю…';
          try {
            if (block.sqlrun) {
              const res = await SqlRunner.run(block.sqlrun, s => { out.textContent = s || '…'; });
              out.innerHTML = res.error ? '<span class="err">' + esc(res.error) + '</span>' : SqlRunner.tableHtml(res.result);
            } else {
              const res = await PyRunner.run(block.run, '', [], s => { out.textContent = s || '…'; });
              out.textContent = res.err ? res.err : (res.out || '(программа ничего не вывела)');
            }
          } catch (e) { out.textContent = '⚠ ' + e.message; }
        });
      });
    }
    draw();
  }

  /* ---------- Квиз ---------- */
  function renderQuiz(id) {
    const data = COURSE_DATA[id];
    const st = mod(id);
    const qs = data.quiz;
    const session = { idx: 0, correct: 0, results: [] };

    function drawQ() {
      if (session.idx >= qs.length) return drawResult();
      const q = qs[session.idx];
      const bar = qs.map((_, i) =>
        '<i class="' + (i < session.results.length ? (session.results[i] ? 'done' : 'wrong') : '') + '"></i>').join('');
      app.innerHTML = modHeader(id, 'quiz') +
        '<div class="quiz-box"><div class="quiz-progress">' + bar + '</div>' +
        '<div class="quiz-q">Вопрос ' + (session.idx + 1) + '/' + qs.length + ': ' + q.q + '</div>' +
        (q.code ? codeBlock(q.code, data.sqlModule ? 'sql' : 'py') : '') +
        '<div class="quiz-opts">' + q.options.map((o, i) =>
          '<button class="quiz-opt" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div>' +
        '<div id="quiz-after"></div></div>';
      bindTabs(id);
      app.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
        const i = +btn.getAttribute('data-i');
        const ok = i === q.a;
        session.results.push(ok);
        if (ok) session.correct++;
        app.querySelectorAll('.quiz-opt').forEach((b, bi) => {
          b.disabled = true;
          if (bi === q.a) b.classList.add('correct');
          else if (bi === i && !ok) b.classList.add('wrong');
        });
        document.getElementById('quiz-after').innerHTML =
          '<div class="quiz-explain">' + (ok ? '<b>Верно.</b> ' : '<b>Не совсем.</b> ') + q.explain + '</div>' +
          '<div style="text-align:right;margin-top:14px"><button class="btn" id="q-next">' +
          (session.idx === qs.length - 1 ? 'Результат' : 'Дальше →') + '</button></div>';
        document.getElementById('q-next').addEventListener('click', () => { session.idx++; drawQ(); });
      }));
    }

    function drawResult() {
      const pct = Math.round((session.correct / qs.length) * 100);
      const prevBestCorrect = Math.round((st.quizBest / 100) * qs.length);
      const gained = Math.max(0, session.correct - prevBestCorrect) * COURSE.xpRewards.quizAnswer;
      if (pct > st.quizBest) st.quizBest = pct;
      save();
      if (gained) addXP(gained);
      if (pct >= 70) confetti(50);
      checkAch();
      const msg = pct >= 100 ? 'Идеально. Материал усвоен полностью.' : pct >= 70 ? 'Квиз пройден — можно идти к задачам.' : 'Нужно 70%. Вернись в теорию и попробуй ещё раз.';
      app.innerHTML = modHeader(id, 'quiz') +
        '<div class="quiz-box"><div class="quiz-result">' +
        '<div class="score-ring' + (pct >= 70 ? ' pass' : '') + '"><span>' + pct + '%</span></div>' +
        '<h2>' + session.correct + ' из ' + qs.length + '</h2><p>' + msg + '</p>' +
        '<button class="btn secondary" id="q-retry">Ещё раз</button> ' +
        (pct >= 70 ? '<a class="btn" href="#/m/' + id + '/tasks">К задачам</a>' : '<a class="btn secondary" href="#/m/' + id + '/theory">К теории</a>') +
        '</div></div>';
      bindTabs(id);
      document.getElementById('q-retry').addEventListener('click', () => renderQuiz(id));
    }
    drawQ();
  }

  /* ---------- Задачи ---------- */
  function renderTasks(id) {
    const data = COURSE_DATA[id];
    const st = mod(id);
    const list = data.tasks.map(t => {
      const solved = !!st.tasks[t.id];
      return '<div class="task-item' + (solved ? ' solved' : '') + '" data-t="' + t.id + '">' +
        '<span class="t-ico">' + (solved ? ic('check', 'ok') : ic('terminal')) + '</span>' +
        '<div><h4>' + t.title + '</h4><p>' + t.brief + '</p></div>' +
        '<span class="t-xp">+' + COURSE.xpRewards.task + ' XP</span></div>';
    }).join('');
    app.innerHTML = modHeader(id, 'tasks') +
      '<p class="tasks-note">' + (data.sqlModule ? 'Запросы выполняются на учебной базе магазина прямо в браузере.' : 'Настоящий Python работает прямо в браузере — пиши код и запускай.') + '</p>' +
      '<div class="task-list">' + list + '</div>';
    bindTabs(id);
    app.querySelectorAll('.task-item').forEach(el => el.addEventListener('click', () => {
      location.hash = '#/m/' + id + '/task/' + el.getAttribute('data-t');
    }));
  }

  function renderTask(id, tid) {
    const data = COURSE_DATA[id];
    const t = data.tasks.find(x => x.id === tid);
    if (!t) return renderTasks(id);
    const st = mod(id);
    const saveKey = 'pyquest_code_' + id + '_' + tid;
    const saved = localStorage.getItem(saveKey);
    app.innerHTML = modHeader(id, 'tasks') +
      '<div class="task-view"><a class="back-link" href="#/m/' + id + '/tasks">' + ic('chevron', 'flip') + ' Все задачи</a>' +
      '<h2>' + (st.tasks[tid] ? ic('check', 'ok') + ' ' : '') + t.title + '</h2>' +
      '<div class="task-desc">' + t.desc + '</div>' +
      '<textarea class="editor" id="ed" spellcheck="false">' + esc(saved !== null ? saved : t.starter) + '</textarea>' +
      '<div class="task-actions">' +
      '<button class="btn blue" id="run-btn">' + ic('play') + (t.sql ? ' Выполнить' : ' Запустить') + '</button>' +
      '<button class="btn" id="check-btn">' + ic('check') + ' Проверить</button>' +
      '<button class="btn secondary small" id="hint-btn">Подсказка</button>' +
      '<button class="btn secondary small" id="reset-btn">Сброс</button>' +
      '<span class="py-loading" id="py-status"></span></div>' +
      '<div class="hint-box" id="hint" style="display:none">' + t.hint + '</div>' +
      '<div class="run-out" id="out">Здесь появится результат…</div></div>';
    bindTabs(id);

    const ed = document.getElementById('ed');
    const out = document.getElementById('out');
    const status = document.getElementById('py-status');
    bindEditor(ed, saveKey);

    document.getElementById('hint-btn').addEventListener('click', () => {
      const h = document.getElementById('hint');
      h.style.display = h.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      ed.value = t.starter;
      localStorage.removeItem(saveKey);
    });

    function onSolved() {
      if (!st.tasks[tid]) {
        st.tasks[tid] = true;
        save();
        addXP(COURSE.xpRewards.task);
        confetti(45);
        checkAch();
        const left = data.tasks.filter(x => !st.tasks[x.id]).length;
        if (!left) setTimeout(() => toast('Все задачи модуля решены — иди на экзамен', 'gold'), 400);
      }
    }

    async function execPy(withTests) {
      out.innerHTML = 'Выполняю…';
      try {
        const res = await PyRunner.run(ed.value, withTests ? t.tests : '', t.stdin || [], s => { status.textContent = s; });
        status.textContent = '';
        if (res.err) { out.innerHTML = '<span class="err">' + esc(res.err) + '</span>'; return; }
        let html = esc(res.out || '(нет вывода)');
        if (withTests) {
          if (res.test_err) html += '\n<span class="err">✗ ' + esc(res.test_err) + '</span>';
          else { html += '\n<span class="ok">✓ Все проверки пройдены!</span>'; onSolved(); }
        }
        out.innerHTML = html;
      } catch (e) { status.textContent = ''; out.innerHTML = '<span class="err">⚠ ' + esc(e.message) + '</span>'; }
    }

    async function execSql(withCheck) {
      out.innerHTML = 'Выполняю…';
      try {
        if (!withCheck) {
          const res = await SqlRunner.run(ed.value, s => { status.textContent = s; });
          status.textContent = '';
          out.innerHTML = res.error ? '<span class="err">' + esc(res.error) + '</span>' : SqlRunner.tableHtml(res.result);
        } else {
          const res = await SqlRunner.check(ed.value, t, s => { status.textContent = s; });
          status.textContent = '';
          let html = res.result ? SqlRunner.tableHtml(res.result) : '';
          if (res.ok) { html += '<p class="ok">✓ ' + esc(res.message) + '</p>'; onSolved(); }
          else html += '<p class="err">✗ ' + esc(res.message) + '</p>';
          out.innerHTML = html;
        }
      } catch (e) { status.textContent = ''; out.innerHTML = '<span class="err">⚠ ' + esc(e.message) + '</span>'; }
    }

    document.getElementById('run-btn').addEventListener('click', () => t.sql ? execSql(false) : execPy(false));
    document.getElementById('check-btn').addEventListener('click', () => t.sql ? execSql(true) : execPy(true));
  }

  /* ---------- Экзамен ---------- */
  function renderExam(ctxId, exam, isFinal) {
    const st = isFinal ? null : mod(ctxId);
    const header = isFinal ? '<a class="back-link" href="#/">' + ic('chevron', 'flip') + ' Карта курса</a>' : modHeader(ctxId, 'exam');
    const title = isFinal ? 'Финальный экзамен: Python' : 'Экзамен модуля';
    const tasks = exam.tasks || (exam.task ? [exam.task] : []);
    const totalPts = exam.questions.length + tasks.length * 3;
    const sqlMode = !isFinal && COURSE_DATA[ctxId].sqlModule;

    function best() { return isFinal ? S.finalBest : st.examBest; }

    function intro() {
      app.innerHTML = header +
        '<div class="exam-intro"><div class="exam-glyph">' + ic(isFinal ? 'trophy' : 'shield') + '</div>' +
        '<h2>' + title + '</h2>' +
        '<p>' + exam.questions.length + ' вопросов' + (tasks.length ? ' + ' + tasks.length + ' практ. ' + (tasks.length === 1 ? 'задача' : 'задачи') : '') + ' · ' + Math.round(exam.time / 60) + ' минут · проходной балл 70%</p>' +
        '<p>Вопрос — 1 балл, задача — 3 балла. Таймер идёт без пауз.</p>' +
        (best() ? '<p>Лучший результат: <b class="gold-text">' + best() + '%</b></p>' : '') +
        '<button class="btn danger" id="exam-start">Начать экзамен</button></div>';
      if (!isFinal) bindTabs(ctxId);
      document.getElementById('exam-start').addEventListener('click', start);
    }

    function start() {
      examSession = { idx: 0, pts: 0, timeLeft: exam.time, timer: null, taskIdx: 0 };
      examSession.timer = setInterval(() => {
        examSession.timeLeft--;
        const el = document.getElementById('ex-time');
        if (el) {
          const m = Math.floor(examSession.timeLeft / 60), s = examSession.timeLeft % 60;
          el.textContent = m + ':' + String(s).padStart(2, '0');
          if (examSession.timeLeft <= 60) el.parentElement.classList.add('low');
        }
        if (examSession.timeLeft <= 0) { clearInterval(examSession.timer); finish(); }
      }, 1000);
      drawQ();
    }

    function timerHtml() { return '<div class="exam-timer"><span>' + ic('clock') + ' <b id="ex-time">…</b></span></div>'; }

    function drawQ() {
      const s = examSession;
      if (s.idx >= exam.questions.length) return drawTask();
      const q = exam.questions[s.idx];
      app.innerHTML = header + timerHtml() +
        '<div class="quiz-box"><div class="quiz-q">Вопрос ' + (s.idx + 1) + '/' + exam.questions.length + ': ' + q.q + '</div>' +
        (q.code ? codeBlock(q.code, sqlMode ? 'sql' : 'py') : '') +
        '<div class="quiz-opts">' + q.options.map((o, i) =>
          '<button class="quiz-opt" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div></div>';
      if (!isFinal) bindTabs(ctxId);
      app.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
        if (+btn.getAttribute('data-i') === q.a) s.pts++;
        s.idx++;
        drawQ();
      }));
    }

    function drawTask() {
      const s = examSession;
      if (s.taskIdx >= tasks.length) return finish();
      const t = tasks[s.taskIdx];
      app.innerHTML = header + timerHtml() +
        '<div class="task-view"><h2>Задача ' + (s.taskIdx + 1) + '/' + tasks.length + ': ' + t.title + ' <span class="gold-text" style="font-size:.8em">3 балла</span></h2>' +
        '<div class="task-desc">' + t.desc + '</div>' +
        '<textarea class="editor" id="ed" spellcheck="false">' + esc(t.starter) + '</textarea>' +
        '<div class="task-actions">' +
        '<button class="btn blue" id="run-btn">' + ic('play') + (t.sql ? ' Выполнить' : ' Запустить') + '</button>' +
        '<button class="btn" id="submit-btn">Сдать задачу</button>' +
        '<span class="py-loading" id="py-status"></span></div>' +
        '<div class="run-out" id="out">Проверь решение перед сдачей.</div></div>';
      if (!isFinal) bindTabs(ctxId);
      const ed = document.getElementById('ed');
      const out = document.getElementById('out');
      bindEditor(ed, null);
      document.getElementById('run-btn').addEventListener('click', async () => {
        out.textContent = '…';
        try {
          if (t.sql) {
            const res = await SqlRunner.run(ed.value, x => { document.getElementById('py-status').textContent = x; });
            document.getElementById('py-status').textContent = '';
            out.innerHTML = res.error ? '<span class="err">' + esc(res.error) + '</span>' : SqlRunner.tableHtml(res.result);
          } else {
            const res = await PyRunner.run(ed.value, '', t.stdin || [], x => { document.getElementById('py-status').textContent = x; });
            document.getElementById('py-status').textContent = '';
            out.innerHTML = res.err ? '<span class="err">' + esc(res.err) + '</span>' : esc(res.out || '(нет вывода)');
          }
        } catch (e) { out.textContent = '⚠ ' + e.message; }
      });
      document.getElementById('submit-btn').addEventListener('click', async () => {
        out.textContent = 'Проверяю…';
        try {
          if (t.sql) {
            const res = await SqlRunner.check(ed.value, t, x => { document.getElementById('py-status').textContent = x; });
            if (res.ok) s.pts += 3;
          } else {
            const res = await PyRunner.run(ed.value, t.tests, t.stdin || [], x => { document.getElementById('py-status').textContent = x; });
            if (!res.err && !res.test_err) s.pts += 3;
          }
        } catch (e) { /* задача не засчитана */ }
        s.taskIdx++;
        drawTask();
      });
    }

    function finish() {
      const s = examSession;
      if (s.timer) clearInterval(s.timer);
      const pct = Math.round((s.pts / totalPts) * 100);
      const passed = pct >= 70;
      let gained = 0;
      if (isFinal) {
        const was = S.finalBest >= 70;
        if (pct > S.finalBest) S.finalBest = pct;
        if (passed && !was) gained += COURSE.xpRewards.finalPass;
      } else {
        const was = st.examBest >= 70;
        if (pct > st.examBest) st.examBest = pct;
        if (passed && !was) gained += COURSE.xpRewards.examPass;
        if (pct === 100 && !st.examPerfect) { st.examPerfect = true; gained += COURSE.xpRewards.examPerfect; }
      }
      save();
      if (gained) addXP(gained);
      if (passed) confetti(100);
      checkAch();
      const msg = passed
        ? (isFinal ? 'Python-трек завершён. Забирай сертификат!' : 'Экзамен сдан — следующий модуль открыт.')
        : 'Не хватило баллов. Повтори теорию и задачи — и возвращайся.';
      app.innerHTML = header +
        '<div class="quiz-box"><div class="quiz-result">' +
        '<div class="score-ring' + (passed ? ' pass' : '') + '"><span>' + pct + '%</span></div>' +
        '<h2>' + s.pts + ' / ' + totalPts + ' баллов</h2><p>' + msg + '</p>' +
        '<button class="btn secondary" id="ex-retry">Пересдать</button> ' +
        (passed ? (isFinal ? '<a class="btn" href="#/cert">Сертификат</a>' : '<a class="btn" href="#/">На карту</a>') : '') +
        '</div></div>';
      if (!isFinal) bindTabs(ctxId);
      document.getElementById('ex-retry').addEventListener('click', intro);
      examSession = null;
    }

    intro();
  }

  /* ---------- Сертификат ---------- */
  function renderCert() {
    if (S.finalBest < 70) { location.hash = '#/'; return; }
    const tracksDone = COURSE.tracks.filter(t => trackDone(t.id)).length;
    app.innerHTML = '<a class="back-link" href="#/">' + ic('chevron', 'flip') + ' На главную</a>' +
      '<div class="cert-wrap"><h1>Сертификат</h1>' +
      '<p class="muted-text">Впиши имя — оно попадёт на сертификат:</p>' +
      '<p style="margin:12px 0"><input class="name-input" id="cert-name" placeholder="Имя Фамилия" value="' + esc(S.name || '') + '"> ' +
      '<button class="btn small" id="cert-draw">Обновить</button></p>' +
      '<canvas id="cert-canvas" width="1200" height="850"></canvas><br>' +
      '<a class="btn" id="cert-dl" download="pyquest-certificate.png">Скачать PNG</a></div>';

    function draw() {
      const name = document.getElementById('cert-name').value.trim() || 'Безымянный Герой';
      S.name = name; save();
      const cv = document.getElementById('cert-canvas');
      const x = cv.getContext('2d');
      const g = x.createLinearGradient(0, 0, 1200, 850);
      g.addColorStop(0, '#0c1322'); g.addColorStop(1, '#101d33');
      x.fillStyle = g; x.fillRect(0, 0, 1200, 850);
      x.strokeStyle = '#38bdf8'; x.lineWidth = 4; x.strokeRect(30, 30, 1140, 790);
      x.strokeStyle = '#1e293b'; x.lineWidth = 2; x.strokeRect(46, 46, 1108, 758);
      x.textAlign = 'center';
      x.fillStyle = '#38bdf8'; x.font = 'bold 54px Segoe UI, sans-serif';
      x.fillText('СЕРТИФИКАТ', 600, 200);
      x.fillStyle = '#8b98ac'; x.font = '25px Segoe UI, sans-serif';
      x.fillText('подтверждает, что', 600, 265);
      x.fillStyle = '#ffffff'; x.font = 'bold 52px Segoe UI, sans-serif';
      x.fillText(name, 600, 345);
      x.fillStyle = '#e6ebf4'; x.font = '27px Segoe UI, sans-serif';
      x.fillText('успешно прошёл(ла) интенсивную программу', 600, 405);
      x.fillStyle = '#34d399'; x.font = 'bold 38px Segoe UI, sans-serif';
      x.fillText('PyQuest · Путь Data Engineer', 600, 465);
      x.fillStyle = '#8b98ac'; x.font = '23px Segoe UI, sans-serif';
      x.fillText('Python-трек пройден · финальный экзамен: ' + S.finalBest + '%', 600, 525);
      x.fillText('Треков завершено: ' + tracksDone + ' из ' + COURSE.tracks.length + ' · ' + S.xp + ' XP', 600, 560);
      const r = rank();
      x.fillStyle = '#fbbf24'; x.font = 'bold 29px Segoe UI, sans-serif';
      x.fillText('Ранг: ' + r.name, 600, 635);
      x.fillStyle = '#5c6b80'; x.font = '21px Segoe UI, sans-serif';
      x.fillText(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · course.azizbek-azimov.uz', 600, 735);
      document.getElementById('cert-dl').href = cv.toDataURL('image/png');
    }
    document.getElementById('cert-draw').addEventListener('click', draw);
    draw();
  }

  /* ---------- Старт ---------- */
  topbar();
  route();
})();
