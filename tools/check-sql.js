/** Проверка SQL-фрагментов на реальном sql.js — том же движке, что в браузере. */
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const OUT = path.join(__dirname, '.out');

(async () => {
  const SQL = await initSqlJs();
  const seed = fs.readFileSync(path.join(OUT, 'seed.sql'), 'utf8');
  const items = JSON.parse(fs.readFileSync(path.join(OUT, 'sql-items.json'), 'utf8'));

  let db = new SQL.Database();
  try { db.run(seed); } catch (e) { console.log('ОШИБКА В УЧЕБНОЙ БАЗЕ:', e.message); process.exit(1); }
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")[0].values.flat();
  console.log('Учебная база собрана. Таблицы:', tables.join(', '));
  db.close();

  const fails = [];
  for (const it of items) {
    const d = new SQL.Database();
    try {
      d.run(seed);
      const res = d.exec(it.sql);
      const last = res.length ? res[res.length - 1] : null;
      if (it.expectRows && (!last || !last.columns.length)) fails.push([it.name, 'решение не вернуло таблицу']);
      else if (it.expectRows && last.values.length === 0) fails.push([it.name, 'решение вернуло 0 строк']);
    } catch (e) {
      fails.push([it.name, 'SQL ошибка: ' + e.message]);
    } finally { d.close(); }
  }

  if (fails.length) {
    console.log('ПРОБЛЕМЫ (' + fails.length + ' из ' + items.length + '):');
    fails.forEach(([n, m]) => console.log(' -', n, '->', m));
    process.exit(1);
  }
  console.log('SQL: все ' + items.length + ' фрагментов выполняются ✔');
})();
