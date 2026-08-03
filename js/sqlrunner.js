/* PyQuest — SQL-тренажёр на sql.js (SQLite в WebAssembly).
   Учебная база загружается лениво из content/sql/store-db.sql. */
(function () {
  let SQL = null;
  let loading = null;
  let seed = null;
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';

  /** Схема учебной базы задаётся снаружи (content.js), чтобы данные жили в content/. */
  function setSeed(text) { seed = text; }

  async function ensure(onStatus) {
    if (SQL && seed) return SQL;
    if (!loading) {
      loading = (async () => {
        if (onStatus) onStatus('Загружаю SQL-движок (~1 МБ, один раз)…');
        if (!SQL) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = CDN + 'sql-wasm.js';
            s.onload = res;
            s.onerror = () => rej(new Error('Не удалось загрузить sql.js. Проверь интернет.'));
            document.head.appendChild(s);
          });
          SQL = await window.initSqlJs({ locateFile: f => CDN + f });
        }
        if (!seed) {
          const res = await fetch('content/sql/store-db.sql?v=' + (window.PQ_VERSION || '1'));
          if (!res.ok) throw new Error('Не удалось загрузить учебную базу');
          seed = await res.text();
        }
        return SQL;
      })();
    }
    return loading;
  }

  function freshDb() {
    const db = new SQL.Database();
    db.run(seed);
    return db;
  }

  function runScript(db, sql) {
    const results = db.exec(sql);
    return results.length ? results[results.length - 1] : { columns: [], values: [] };
  }

  function norm(v) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
    return String(v);
  }
  function normRows(res) { return res.values.map(row => row.map(norm)); }

  async function run(sql, onStatus) {
    await ensure(onStatus);
    if (onStatus) onStatus('');
    let db;
    try {
      db = freshDb();
      return { result: runScript(db, sql) };
    } catch (e) {
      return { error: e.message };
    } finally {
      if (db) db.close();
    }
  }

  /** Проверка задачи: сравнение результата запроса с эталонным решением. */
  async function check(sql, task, onStatus) {
    await ensure(onStatus);
    if (onStatus) onStatus('');
    let dbU, dbS;
    try {
      dbU = freshDb();
      let userRes;
      try {
        userRes = runScript(dbU, sql);
        if (task.checkQuery) userRes = runScript(dbU, task.checkQuery);
      } catch (e) {
        return { ok: false, message: 'Ошибка SQL: ' + e.message, result: null };
      }

      dbS = freshDb();
      let solRes = runScript(dbS, task.solution);
      if (task.checkQuery) solRes = runScript(dbS, task.checkQuery);

      const u = normRows(userRes), s = normRows(solRes);
      const cols = solRes.columns.length;

      if (userRes.columns.length !== cols)
        return { ok: false, result: userRes, message: 'Колонок в результате: ' + userRes.columns.length + ', а ожидается ' + cols + '. Проверь список полей в SELECT.' };
      if (u.length !== s.length)
        return { ok: false, result: userRes, message: 'Строк в результате: ' + u.length + ', а ожидается ' + s.length + '. Проверь условия запроса.' };

      let uu = u, ss = s;
      if (!task.orderMatters) {
        const key = r => JSON.stringify(r);
        uu = [...u].sort((a, b) => key(a) < key(b) ? -1 : 1);
        ss = [...s].sort((a, b) => key(a) < key(b) ? -1 : 1);
      }
      for (let i = 0; i < ss.length; i++) {
        if (JSON.stringify(uu[i]) !== JSON.stringify(ss[i])) {
          return {
            ok: false, result: userRes,
            message: task.orderMatters && JSON.stringify([...u].sort()) === JSON.stringify([...s].sort())
              ? 'Данные верные, но порядок строк не тот. Проверь ORDER BY.'
              : 'Строка ' + (i + 1) + ' не совпадает: получено [' + uu[i].join(', ') + '], а ожидается [' + ss[i].join(', ') + '].',
          };
        }
      }
      return { ok: true, result: userRes, message: 'Запрос верный!' };
    } finally {
      if (dbU) dbU.close();
      if (dbS) dbS.close();
    }
  }

  function tableHtml(res) {
    if (!res || !res.columns.length) return '<p class="sql-empty">Запрос выполнен, строк не возвращено.</p>';
    const esc = x => String(x === null ? 'NULL' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let h = '<div class="sql-table-wrap" tabindex="0"><table class="sql-table"><thead><tr>' +
      res.columns.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
    res.values.slice(0, 30).forEach(row => {
      h += '<tr>' + row.map(v => '<td' + (v === null ? ' class="null"' : '') + '>' + esc(v) + '</td>').join('') + '</tr>';
    });
    h += '</tbody></table></div>';
    if (res.values.length > 30) h += '<p class="sql-empty">…показаны первые 30 из ' + res.values.length + ' строк</p>';
    return h;
  }

  window.SqlRunner = { run, check, ensure, tableHtml, setSeed, isReady: () => !!(SQL && seed) };
})();
