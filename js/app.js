/* ===== PyQuest — движок приложения ===== */
(function () {
  'use strict';

  /* ---------- Состояние ---------- */
  const KEY = 'pyquest_v1';
  const DEF = { xp: 0, streak: 0, lastDay: null, start: null, name: '', mods: {}, ach: [], finalBest: 0, solvedCount: 0 };
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
    if (!silent) toast('⚡ +' + n + ' XP');
    checkAch();
    topbar();
  }

  /* ---------- Ачивки ---------- */
  function completedCount() { return COURSE.modules.filter(m => isCompleted(m.id)).length; }
  function solvedTasks() {
    let n = 0;
    for (const id in S.mods) n += Object.keys(S.mods[id].tasks || {}).length;
    return n;
  }
  function checkAch() {
    const passed = COURSE.modules.filter(m => mod(m.id).examBest >= 70).length;
    const cond = {
      'first-code': solvedTasks() >= 1,
      'quiz-perfect': Object.values(S.mods).some(m => m.quizBest >= 100),
      'boss-1': passed >= 1,
      'streak-3': S.streak >= 3,
      'streak-7': S.streak >= 7,
      'half-way': completedCount() >= 5,
      'exam-perfect': Object.values(S.mods).some(m => m.examPerfect),
      'xp-1000': S.xp >= 1000,
      'all-tasks': solvedTasks() >= 20,
      'finisher': S.finalBest >= 70,
    };
    for (const a of COURSE.achievements) {
      if (cond[a.id] && !S.ach.includes(a.id)) {
        S.ach.push(a.id);
        save();
        toast(a.icon + ' Ачивка: <b>' + a.name + '</b>!', 'gold');
        confetti(40);
      }
    }
  }

  /* ---------- Прогресс модулей ---------- */
  function isCompleted(id) {
    const m = mod(id), data = COURSE_DATA[id];
    if (!data) return false;
    const allTasks = data.tasks.every(t => m.tasks[t.id]);
    return m.theory && m.quizBest >= 70 && allTasks && m.examBest >= 70;
  }
  function isUnlocked(idx) {
    if (idx === 0) return true;
    return mod(COURSE.modules[idx - 1].id).examBest >= 70;
  }
  function finalUnlocked() { return COURSE.modules.every(m => mod(m.id).examBest >= 70); }

  /* ---------- Утилиты UI ---------- */
  const app = document.getElementById('app');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function hl(src) {
    let s = esc(src);
    const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(\d+(?:\.\d+)?)\b|\b(def|return|if|elif|else|for|while|in|not|and|or|import|from|as|class|try|except|finally|with|pass|break|continue|True|False|None|lambda|is|del|raise|global|yield|self)\b|\b(print|input|len|range|type|int|str|float|bool|list|dict|open|sum|min|max|sorted|enumerate|append|round|abs|zip|isinstance|super)\b/g;
    s = s.replace(re, (m, com, str, num, kw, fn) => {
      if (com) return '<span class="py-com">' + com + '</span>';
      if (str) return '<span class="py-str">' + str + '</span>';
      if (num) return '<span class="py-num">' + num + '</span>';
      if (kw) return '<span class="py-kw">' + kw + '</span>';
      if (fn) return '<span class="py-fn">' + fn + '</span>';
      return m;
    });
    return s;
  }
  function codeBlock(code) { return '<pre class="code"><code>' + hl(code) + '</code></pre>'; }

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
    const colors = ['#4ade80', '#38bdf8', '#fbbf24', '#a78bfa', '#f87171', '#f472b6'];
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
    document.getElementById('stat-rank').textContent = r.icon + ' ' + r.name;
  }

  /* ---------- Роутер ---------- */
  let quizSession = null, examSession = null;

  function route() {
    if (examSession && examSession.timer) { clearInterval(examSession.timer); }
    quizSession = null; examSession = null;
    const parts = (location.hash.slice(2) || '').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    if (parts[0] === 'm' && parts[1]) {
      const id = parts[1];
      const idx = COURSE.modules.findIndex(m => m.id === id);
      if (idx === -1 || !COURSE_DATA[id]) return renderDash();
      if (!isUnlocked(idx)) { toast('🔒 Сначала сдай экзамен предыдущего модуля!'); location.hash = '#/'; return; }
      if (parts[2] === 'task' && parts[3]) return renderTask(id, parts[3]);
      return renderModule(id, parts[2] || 'theory');
    }
    if (parts[0] === 'final') {
      if (!finalUnlocked()) { toast('🔒 Финал откроется после всех 10 экзаменов!'); location.hash = '#/'; return; }
      return renderExam('final', COURSE_DATA.final, true);
    }
    if (parts[0] === 'cert') return renderCert();
    renderDash();
  }
  window.addEventListener('hashchange', route);

  /* ---------- Главная ---------- */
  function planDayIndex() {
    const start = new Date(S.start + 'T00:00:00');
    const diff = Math.floor((new Date() - start) / 86400000) + 1;
    return Math.max(1, diff);
  }

  function renderDash() {
    const r = rank(), nr = nextRank();
    const pct = nr ? Math.round(((S.xp - r.xp) / (nr.xp - r.xp)) * 100) : 100;
    const dayIdx = planDayIndex();
    const planToday = dayIdx <= 14 ? COURSE.plan[dayIdx - 1].text : '⏰ 14 дней прошло — добивай оставшиеся модули, не сдавайся!';
    const next = COURSE.modules.find((m, i) => isUnlocked(i) && !isCompleted(m.id));
    const contHref = S.finalBest >= 70 ? '#/cert' : (next ? '#/m/' + next.id : (finalUnlocked() ? '#/final' : '#/'));
    const contText = S.finalBest >= 70 ? '👑 Мой сертификат' : (next ? '▶ Продолжить: ' + next.title : '🏆 Финальный экзамен');

    let map = '';
    COURSE.modules.forEach((m, i) => {
      const st = mod(m.id);
      const unlocked = isUnlocked(i), completed = isCompleted(m.id);
      const data = COURSE_DATA[m.id];
      const tasksDone = data.tasks.filter(t => st.tasks[t.id]).length;
      const statusIco = completed ? '✅' : (unlocked ? '▶️' : '🔒');
      map += '<div class="level-row' + (completed ? ' done' : '') + '">' +
        '<div class="level-connector"></div>' +
        '<div class="level-card ' + (unlocked ? '' : 'locked') + (completed ? ' completed' : '') + '" data-go="' + (unlocked ? '#/m/' + m.id : '') + '">' +
        '<div class="level-icon">' + m.icon + '</div>' +
        '<div class="level-info"><h3>' + (i + 1) + '. ' + m.title + '</h3><p>' + m.tagline + '</p>' +
        '<div class="level-badges">' +
        '<span class="chip' + (st.theory ? ' ok' : '') + '">📚 теория</span>' +
        '<span class="chip' + (st.quizBest >= 70 ? ' ok' : '') + '">🎯 квиз ' + st.quizBest + '%</span>' +
        '<span class="chip' + (tasksDone === data.tasks.length ? ' ok' : '') + '">🧠 задачи ' + tasksDone + '/' + data.tasks.length + '</span>' +
        '<span class="chip' + (st.examBest >= 70 ? ' ok' : '') + '">⚔️ босс ' + st.examBest + '%</span>' +
        '</div></div>' +
        '<div class="level-status">' + statusIco + '</div></div></div>';
    });
    const fUnlocked = finalUnlocked();
    map += '<div class="level-row"><div class="level-connector"></div>' +
      '<div class="level-card ' + (fUnlocked ? '' : 'locked') + (S.finalBest >= 70 ? ' completed' : '') + '" data-go="' + (fUnlocked ? '#/final' : '') + '">' +
      '<div class="level-icon">🏆</div><div class="level-info"><h3>ФИНАЛЬНЫЙ БОСС</h3>' +
      '<p>Большой экзамен по всему курсу. Пройди — и получи сертификат!</p>' +
      (S.finalBest ? '<div class="level-badges"><span class="chip' + (S.finalBest >= 70 ? ' ok' : '') + '">🏆 результат ' + S.finalBest + '%</span></div>' : '') +
      '</div><div class="level-status">' + (S.finalBest >= 70 ? '👑' : (fUnlocked ? '⚔️' : '🔒')) + '</div></div></div>';

    let plan = '';
    COURSE.plan.forEach(p => {
      const cls = p.day === dayIdx ? ' today' : (p.day < dayIdx ? ' past' : '');
      const date = new Date(S.start + 'T00:00:00'); date.setDate(date.getDate() + p.day - 1);
      const ds = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      plan += '<div class="plan-day' + cls + '"><div class="d">ДЕНЬ ' + p.day + ' <span>· ' + ds + (p.day === dayIdx ? ' · сегодня' : '') + '</span></div><p>' + p.text + '</p></div>';
    });

    let ach = '';
    COURSE.achievements.forEach(a => {
      const un = S.ach.includes(a.id);
      ach += '<div class="ach ' + (un ? 'unlocked' : 'locked') + '"><span class="ico">' + a.icon + '</span><b>' + a.name + '</b><span class="desc">' + a.desc + '</span></div>';
    });

    app.innerHTML =
      '<div class="hero"><div>' +
      '<h1>Привет! Прокачаем <span>Python</span> 🚀</h1>' +
      '<p class="sub">10 уровней · задачи с автопроверкой · экзамены-боссы · Python прямо в браузере</p>' +
      '<div class="xp-bar-wrap"><div class="xp-bar-label"><span>' + r.icon + ' ' + r.name + '</span><span>' +
      (nr ? S.xp + ' / ' + nr.xp + ' XP до «' + nr.name + '»' : S.xp + ' XP · максимум!') + '</span></div>' +
      '<div class="xp-bar"><div style="width:' + pct + '%"></div></div></div>' +
      '</div>' +
      '<div class="hero-today"><h3>📅 План на сегодня (день ' + Math.min(dayIdx, 14) + '/14)</h3><p>' + planToday + '</p>' +
      '<a class="btn small" href="' + contHref + '">' + contText + '</a></div></div>' +
      '<h2 class="section-title">🗺️ Карта уровней <small>сдай экзамен, чтобы открыть следующий</small></h2>' +
      '<div class="quest-map">' + map + '</div>' +
      '<h2 class="section-title">📅 Интенсив: 14 дней <small>начат ' + new Date(S.start + 'T00:00:00').toLocaleDateString('ru-RU') + '</small></h2>' +
      '<div class="plan-grid">' + plan + '</div>' +
      '<h2 class="section-title">🏅 Ачивки <small>' + S.ach.length + '/' + COURSE.achievements.length + '</small></h2>' +
      '<div class="ach-grid">' + ach + '</div>';

    app.querySelectorAll('[data-go]').forEach(el => {
      el.addEventListener('click', () => {
        const go = el.getAttribute('data-go');
        if (go) location.hash = go;
        else toast('🔒 Сначала сдай экзамен предыдущего модуля!');
      });
    });
  }

  /* ---------- Страница модуля ---------- */
  function modHeader(id, tab) {
    const m = COURSE.modules.find(x => x.id === id);
    const idx = COURSE.modules.findIndex(x => x.id === id);
    const st = mod(id);
    const data = COURSE_DATA[id];
    const tasksDone = data.tasks.filter(t => st.tasks[t.id]).length;
    const tabs = [
      ['theory', '📚 Теория', st.theory],
      ['quiz', '🎯 Квиз', st.quizBest >= 70],
      ['tasks', '🧠 Задачи', tasksDone === data.tasks.length],
      ['exam', '⚔️ Босс', st.examBest >= 70],
    ];
    return '<a class="back-link" href="#/">← Карта уровней</a>' +
      '<div class="mod-header"><div class="level-icon">' + m.icon + '</div>' +
      '<div><h1>Уровень ' + (idx + 1) + ': ' + m.title + '</h1><p>' + m.tagline + '</p></div></div>' +
      '<div class="tabs">' + tabs.map(t =>
        '<div class="tab' + (tab === t[0] ? ' active' : '') + '" data-tab="' + t[0] + '">' + t[1] +
        (t[2] ? ' <span class="done-mark">✔</span>' : '') + '</div>').join('') + '</div>';
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
        else if (b.code) body += codeBlock(b.code);
        else if (b.run) body += codeBlock(b.run) +
          '<div class="try-box"><button class="btn small blue" data-run="1">▶ Запустить пример</button>' +
          '<div class="try-out" style="display:none"></div></div>';
      }
      app.innerHTML = modHeader(id, 'theory') +
        '<div class="theory-card"><h2>' + card.title + '</h2>' + body +
        '<div class="theory-nav">' +
        '<button class="btn secondary" id="th-prev" ' + (idx === 0 ? 'disabled' : '') + '>← Назад</button>' +
        '<span class="theory-progress">' + (idx + 1) + ' / ' + data.theory.length + '</span>' +
        (idx < data.theory.length - 1
          ? '<button class="btn" id="th-next">Дальше →</button>'
          : '<button class="btn" id="th-done">' + (st.theory ? 'К квизу 🎯' : 'Завершить теорию ✅') + '</button>') +
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
      const runBlocks = card.blocks.filter(b => b && b.run);
      app.querySelectorAll('[data-run]').forEach((runBtn, bi) => {
        runBtn.addEventListener('click', async () => {
          const out = runBtn.parentElement.querySelector('.try-out');
          out.style.display = 'block';
          out.textContent = '⏳ Выполняю…';
          try {
            const res = await PyRunner.run(runBlocks[bi].run, '', [], s => { out.textContent = s || '⏳'; });
            out.textContent = res.err ? res.err : (res.out || '(программа ничего не вывела)');
          } catch (e) { out.textContent = '⚠️ ' + e.message; }
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
    quizSession = { idx: 0, correct: 0, results: [] };

    function drawQ() {
      const s = quizSession;
      if (s.idx >= qs.length) return drawResult();
      const q = qs[s.idx];
      let bar = qs.map((_, i) =>
        '<i class="' + (i < s.results.length ? (s.results[i] ? 'done' : 'wrong') : '') + '"></i>').join('');
      app.innerHTML = modHeader(id, 'quiz') +
        '<div class="quiz-box"><div class="quiz-progress">' + bar + '</div>' +
        '<div class="quiz-q">Вопрос ' + (s.idx + 1) + '/' + qs.length + ': ' + q.q + '</div>' +
        (q.code ? codeBlock(q.code) : '') +
        '<div class="quiz-opts">' + q.options.map((o, i) =>
          '<button class="quiz-opt" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div>' +
        '<div id="quiz-after"></div></div>';
      bindTabs(id);
      app.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
        const i = +btn.getAttribute('data-i');
        const ok = i === q.a;
        s.results.push(ok);
        if (ok) s.correct++;
        app.querySelectorAll('.quiz-opt').forEach((b, bi) => {
          b.disabled = true;
          if (bi === q.a) b.classList.add('correct');
          else if (bi === i && !ok) b.classList.add('wrong');
        });
        document.getElementById('quiz-after').innerHTML =
          '<div class="quiz-explain">' + (ok ? '✅ <b>Верно!</b> ' : '❌ <b>Не совсем.</b> ') + q.explain + '</div>' +
          '<div style="text-align:right;margin-top:14px"><button class="btn" id="q-next">' +
          (s.idx === qs.length - 1 ? 'Результат 🏁' : 'Дальше →') + '</button></div>';
        document.getElementById('q-next').addEventListener('click', () => { s.idx++; drawQ(); });
      }));
    }

    function drawResult() {
      const s = quizSession;
      const pct = Math.round((s.correct / qs.length) * 100);
      const prevBestCorrect = Math.round((st.quizBest / 100) * qs.length);
      const gained = Math.max(0, s.correct - prevBestCorrect) * COURSE.xpRewards.quizAnswer;
      if (pct > st.quizBest) st.quizBest = pct;
      save();
      if (gained) addXP(gained);
      if (pct >= 70) confetti(50);
      checkAch();
      const emo = pct >= 100 ? '🏆' : pct >= 70 ? '🎉' : '😅';
      const msg = pct >= 100 ? 'Идеально! Ты машина!' : pct >= 70 ? 'Квиз пройден! Так держать!' : 'Нужно 70%. Перечитай теорию и попробуй ещё раз — ты сможешь!';
      app.innerHTML = modHeader(id, 'quiz') +
        '<div class="quiz-box"><div class="quiz-result"><div class="big">' + emo + '</div>' +
        '<h2>' + s.correct + ' из ' + qs.length + ' (' + pct + '%)</h2><p>' + msg + '</p>' +
        '<button class="btn secondary" id="q-retry">🔄 Ещё раз</button> ' +
        (pct >= 70 ? '<a class="btn" href="#/m/' + id + '/tasks">К задачам 🧠</a>' : '<a class="btn secondary" href="#/m/' + id + '/theory">📚 К теории</a>') +
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
    let list = data.tasks.map(t => {
      const solved = !!st.tasks[t.id];
      return '<div class="task-item' + (solved ? ' solved' : '') + '" data-t="' + t.id + '">' +
        '<span class="ico">' + (solved ? '✅' : '📝') + '</span>' +
        '<div><h4>' + t.title + '</h4><p>' + t.brief + '</p></div>' +
        '<span style="margin-left:auto;color:var(--gold);font-size:.85rem">+' + COURSE.xpRewards.task + ' XP</span></div>';
    }).join('');
    app.innerHTML = modHeader(id, 'tasks') +
      '<p style="color:var(--muted);margin-bottom:14px">Настоящий Python работает прямо в браузере — пиши код и жми «Проверить»!</p>' +
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
    const saved = localStorage.getItem('pyquest_code_' + id + '_' + tid);
    app.innerHTML = modHeader(id, 'tasks') +
      '<div class="task-view"><a class="back-link" href="#/m/' + id + '/tasks">← Все задачи</a>' +
      '<h2>' + (st.tasks[tid] ? '✅ ' : '📝 ') + t.title + '</h2>' +
      '<div class="task-desc">' + t.desc + '</div>' +
      '<textarea class="editor" id="ed" spellcheck="false">' + esc(saved !== null ? saved : t.starter) + '</textarea>' +
      '<div class="task-actions">' +
      '<button class="btn blue" id="run-btn">▶ Запустить</button>' +
      '<button class="btn" id="check-btn">✅ Проверить</button>' +
      '<button class="btn secondary small" id="hint-btn">💡 Подсказка</button>' +
      '<button class="btn secondary small" id="reset-btn">↺ Сброс</button>' +
      '<span class="py-loading" id="py-status"></span></div>' +
      '<div class="hint-box" id="hint" style="display:none">💡 ' + t.hint + '</div>' +
      '<div class="run-out" id="out">Тут появится вывод твоей программы…</div></div>';
    bindTabs(id);

    const ed = document.getElementById('ed');
    const out = document.getElementById('out');
    const status = document.getElementById('py-status');
    ed.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ed.selectionStart;
        ed.value = ed.value.slice(0, s) + '    ' + ed.value.slice(ed.selectionEnd);
        ed.selectionStart = ed.selectionEnd = s + 4;
      }
    });
    ed.addEventListener('input', () => localStorage.setItem('pyquest_code_' + id + '_' + tid, ed.value));

    document.getElementById('hint-btn').addEventListener('click', () => {
      const h = document.getElementById('hint');
      h.style.display = h.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      ed.value = t.starter;
      localStorage.removeItem('pyquest_code_' + id + '_' + tid);
    });

    async function exec(withTests) {
      out.innerHTML = '⏳ Выполняю…';
      try {
        const res = await PyRunner.run(ed.value, withTests ? t.tests : '', t.stdin || [], s => { status.textContent = s; });
        status.textContent = '';
        if (res.err) {
          out.innerHTML = '<span class="err">' + esc(res.err) + '</span>';
          return;
        }
        let html = esc(res.out || '(нет вывода)');
        if (withTests) {
          if (res.test_err) {
            html += '\n<span class="err">❌ ' + esc(res.test_err) + '</span>';
          } else {
            html += '\n<span class="ok">🎉 Все проверки пройдены!</span>';
            if (!st.tasks[tid]) {
              st.tasks[tid] = true;
              save();
              addXP(COURSE.xpRewards.task);
              confetti(45);
              checkAch();
            }
            setTimeout(() => {
              const nextTask = data.tasks.find(x => !st.tasks[x.id]);
              if (!nextTask) toast('🧠 Все задачи модуля решены! Иди на босса ⚔️', 'gold');
            }, 400);
          }
        }
        out.innerHTML = html;
      } catch (e) {
        status.textContent = '';
        out.innerHTML = '<span class="err">⚠️ ' + esc(e.message) + '</span>';
      }
    }
    document.getElementById('run-btn').addEventListener('click', () => exec(false));
    document.getElementById('check-btn').addEventListener('click', () => exec(true));
  }

  /* ---------- Экзамен (босс модуля и финал) ---------- */
  function renderExam(ctxId, exam, isFinal) {
    const st = isFinal ? null : mod(ctxId);
    const best = isFinal ? S.finalBest : st.examBest;
    const title = isFinal ? '🏆 ФИНАЛЬНЫЙ БОСС' : '⚔️ Босс модуля';
    const header = isFinal
      ? '<a class="back-link" href="#/">← Карта уровней</a>'
      : modHeader(ctxId, 'exam');
    const totalPts = exam.questions.length + (exam.tasks ? exam.tasks.length * 3 : (exam.task ? 3 : 0));

    function intro() {
      app.innerHTML = header +
        '<div class="exam-intro"><div class="big">' + (isFinal ? '🏆' : '⚔️') + '</div>' +
        '<h2>' + title + '</h2>' +
        '<p>' + exam.questions.length + ' вопросов' + (exam.tasks ? ' + ' + exam.tasks.length + ' задачи на код' : (exam.task ? ' + 1 задача на код' : '')) + ' · ⏱ ' + Math.round(exam.time / 60) + ' минут · проходной балл 70%</p>' +
        '<p>Каждый вопрос — 1 балл, задача на код — 3 балла. Таймер не останавливается!</p>' +
        (best ? '<p>Твой лучший результат: <b style="color:var(--gold)">' + best + '%</b></p>' : '') +
        '<button class="btn danger" id="exam-start" style="margin-top:12px">🔥 НАЧАТЬ БОЙ</button></div>';
      if (!isFinal) bindTabs(ctxId);
      document.getElementById('exam-start').addEventListener('click', start);
    }

    function start() {
      examSession = { idx: 0, pts: 0, results: [], timeLeft: exam.time, timer: null, taskIdx: 0 };
      const tasks = exam.tasks || (exam.task ? [exam.task] : []);
      examSession.tasks = tasks;
      examSession.timer = setInterval(() => {
        examSession.timeLeft--;
        const el = document.getElementById('ex-time');
        if (el) {
          const m = Math.floor(examSession.timeLeft / 60), s = examSession.timeLeft % 60;
          el.textContent = '⏱ ' + m + ':' + String(s).padStart(2, '0');
          if (examSession.timeLeft <= 60) el.classList.add('low');
        }
        if (examSession.timeLeft <= 0) { clearInterval(examSession.timer); finish(); }
      }, 1000);
      drawQ();
    }

    function timerHtml() { return '<div class="exam-timer"><span id="ex-time">⏱</span></div>'; }

    function drawQ() {
      const s = examSession;
      if (s.idx >= exam.questions.length) return drawTask();
      const q = exam.questions[s.idx];
      app.innerHTML = header + timerHtml() +
        '<div class="quiz-box"><div class="quiz-q">Вопрос ' + (s.idx + 1) + '/' + exam.questions.length + ': ' + q.q + '</div>' +
        (q.code ? codeBlock(q.code) : '') +
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
      if (s.taskIdx >= s.tasks.length) return finish();
      const t = s.tasks[s.taskIdx];
      app.innerHTML = header + timerHtml() +
        '<div class="task-view"><h2>💻 Задача ' + (s.taskIdx + 1) + '/' + s.tasks.length + ': ' + t.title + ' <span style="color:var(--gold);font-size:.8em">(3 балла)</span></h2>' +
        '<div class="task-desc">' + t.desc + '</div>' +
        '<textarea class="editor" id="ed" spellcheck="false">' + esc(t.starter) + '</textarea>' +
        '<div class="task-actions">' +
        '<button class="btn blue" id="run-btn">▶ Запустить</button>' +
        '<button class="btn" id="submit-btn">📤 Сдать задачу</button>' +
        '<span class="py-loading" id="py-status"></span></div>' +
        '<div class="run-out" id="out">Проверь код кнопкой «Запустить» перед сдачей.</div></div>';
      if (!isFinal) bindTabs(ctxId);
      const ed = document.getElementById('ed');
      const out = document.getElementById('out');
      ed.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const p = ed.selectionStart;
          ed.value = ed.value.slice(0, p) + '    ' + ed.value.slice(ed.selectionEnd);
          ed.selectionStart = ed.selectionEnd = p + 4;
        }
      });
      document.getElementById('run-btn').addEventListener('click', async () => {
        out.textContent = '⏳…';
        try {
          const res = await PyRunner.run(ed.value, '', t.stdin || [], x => { document.getElementById('py-status').textContent = x; });
          document.getElementById('py-status').textContent = '';
          out.innerHTML = res.err ? '<span class="err">' + esc(res.err) + '</span>' : esc(res.out || '(нет вывода)');
        } catch (e) { out.textContent = '⚠️ ' + e.message; }
      });
      document.getElementById('submit-btn').addEventListener('click', async () => {
        out.textContent = '⏳ Проверяю…';
        try {
          const res = await PyRunner.run(ed.value, t.tests, t.stdin || [], x => { document.getElementById('py-status').textContent = x; });
          document.getElementById('py-status').textContent = '';
          if (!res.err && !res.test_err) s.pts += 3;
          s.taskIdx++;
          drawTask();
        } catch (e) { s.taskIdx++; drawTask(); }
      });
    }

    function finish() {
      const s = examSession;
      if (s.timer) clearInterval(s.timer);
      const pct = Math.round((s.pts / totalPts) * 100);
      const passed = pct >= 70;
      let gained = 0;
      if (isFinal) {
        const wasPassed = S.finalBest >= 70;
        if (pct > S.finalBest) S.finalBest = pct;
        if (passed && !wasPassed) gained += COURSE.xpRewards.finalPass;
      } else {
        const wasPassed = st.examBest >= 70;
        if (pct > st.examBest) st.examBest = pct;
        if (passed && !wasPassed) gained += COURSE.xpRewards.examPass;
        if (pct === 100 && !st.examPerfect) { st.examPerfect = true; gained += COURSE.xpRewards.examPerfect; }
      }
      save();
      if (gained) addXP(gained);
      if (passed) confetti(100);
      checkAch();
      const emo = passed ? (pct === 100 ? '👑' : '🎉') : '💀';
      const msg = passed
        ? (isFinal ? 'ТЫ ПРОШЁЛ ВЕСЬ КУРС! Забирай сертификат!' : 'Босс повержен! Следующий уровень открыт!')
        : 'Босс оказался сильнее… Повтори теорию и задачи — и возвращайся!';
      app.innerHTML = header +
        '<div class="quiz-box"><div class="quiz-result"><div class="big">' + emo + '</div>' +
        '<h2>' + s.pts + ' / ' + totalPts + ' баллов (' + pct + '%)</h2><p>' + msg + '</p>' +
        '<button class="btn secondary" id="ex-retry">🔄 Пересдать</button> ' +
        (passed
          ? (isFinal ? '<a class="btn" href="#/cert">👑 Сертификат</a>' : '<a class="btn" href="#/">🗺️ На карту</a>')
          : '') +
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
    app.innerHTML = '<a class="back-link" href="#/">← Карта уровней</a>' +
      '<div class="cert-wrap"><h1 style="margin-bottom:10px">👑 Твой сертификат</h1>' +
      '<p style="color:var(--muted)">Впиши имя — оно попадёт на сертификат:</p>' +
      '<p style="margin:12px 0"><input class="name-input" id="cert-name" placeholder="Имя Фамилия" value="' + esc(S.name || '') + '"> ' +
      '<button class="btn small" id="cert-draw">Обновить</button></p>' +
      '<canvas id="cert-canvas" width="1200" height="850"></canvas><br>' +
      '<a class="btn" id="cert-dl" download="pyquest-certificate.png">⬇ Скачать PNG</a></div>';

    function draw() {
      const name = document.getElementById('cert-name').value.trim() || 'Безымянный Герой';
      S.name = name; save();
      const cv = document.getElementById('cert-canvas');
      const x = cv.getContext('2d');
      const g = x.createLinearGradient(0, 0, 1200, 850);
      g.addColorStop(0, '#0d1b2a'); g.addColorStop(1, '#12263a');
      x.fillStyle = g; x.fillRect(0, 0, 1200, 850);
      x.strokeStyle = '#4ade80'; x.lineWidth = 6; x.strokeRect(30, 30, 1140, 790);
      x.strokeStyle = '#38bdf8'; x.lineWidth = 2; x.strokeRect(46, 46, 1108, 758);
      x.textAlign = 'center';
      x.font = '90px serif'; x.fillText('🐍', 600, 160);
      x.fillStyle = '#4ade80'; x.font = 'bold 56px Segoe UI, sans-serif';
      x.fillText('СЕРТИФИКАТ', 600, 250);
      x.fillStyle = '#94a3b8'; x.font = '26px Segoe UI, sans-serif';
      x.fillText('подтверждает, что', 600, 310);
      x.fillStyle = '#ffffff'; x.font = 'bold 52px Segoe UI, sans-serif';
      x.fillText(name, 600, 390);
      x.fillStyle = '#e8eef7'; x.font = '28px Segoe UI, sans-serif';
      x.fillText('успешно прошёл(ла) интенсивный курс', 600, 450);
      x.fillStyle = '#38bdf8'; x.font = 'bold 40px Segoe UI, sans-serif';
      x.fillText('PyQuest — Python с нуля', 600, 510);
      x.fillStyle = '#94a3b8'; x.font = '24px Segoe UI, sans-serif';
      x.fillText('10 модулей · ' + S.xp + ' XP · результат финального экзамена: ' + S.finalBest + '%', 600, 570);
      const r = rank();
      x.fillStyle = '#fbbf24'; x.font = 'bold 30px Segoe UI, sans-serif';
      x.fillText('Ранг: ' + r.icon + ' ' + r.name, 600, 640);
      x.fillStyle = '#64748b'; x.font = '22px Segoe UI, sans-serif';
      x.fillText(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · course.azizbek-azimov.uz', 600, 740);
      document.getElementById('cert-dl').href = cv.toDataURL('image/png');
    }
    document.getElementById('cert-draw').addEventListener('click', draw);
    draw();
  }

  /* ---------- Старт ---------- */
  topbar();
  route();
})();
