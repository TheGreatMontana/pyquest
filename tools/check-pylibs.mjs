/**
 * check-pylibs.mjs — прогон Python-фрагментов, которым нужны пакеты Pyodide.
 *
 * numpy и pandas в обычном CPython на машине разработчика могут быть не
 * установлены, поэтому check-python.py и check-tasks.py такие фрагменты
 * честно пропускают. Здесь они выполняются по-настоящему — в том же
 * Pyodide, который видит студент, через headless Chrome на живом сайте.
 *
 *   node tools/check-pylibs.mjs [url]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(HERE, '..', 'content');
const BASE = (process.argv[2] || 'https://course.azizbek-azimov.uz/').replace(/\/$/, '') + '/';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));

/* Эталонные решения нужны, чтобы проверять не только примеры, но и задачи */
const solutionsText = fs.readFileSync(path.join(HERE, 'solutions.py'), 'utf8');

/** Достаёт эталон по ключу из solutions.py, не запуская Python. */
function solutionFor(key) {
  const marker = "'" + key + "': ";
  const at = solutionsText.indexOf(marker);
  if (at < 0) return null;
  let i = at + marker.length;
  const triple = solutionsText.startsWith('"""', i);
  const quote = triple ? '"""' : solutionsText[i];
  i += quote.length;
  const end = solutionsText.indexOf(quote, i);
  if (end < 0) return null;
  const raw = solutionsText.slice(i, end);
  return triple ? raw : raw.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

/* ---------- собираем всё, что требует пакетов ---------- */
const items = [];
const catalog = read(path.join(CONTENT, 'catalog.json'));

for (const meta of catalog.courses) {
  const file = path.join(CONTENT, 'courses', meta.id + '.json');
  if (!fs.existsSync(file)) continue;
  const course = read(file);

  for (const m of course.modules) {
    for (const lesson of m.lessons || []) {
      (lesson.blocks || []).forEach((b, bi) => {
        if ((b.type === 'run' || b.type === 'predict') && b.packages && b.packages.length) {
          items.push({ name: `${meta.id}/${m.id}/${lesson.id}.b${bi}`, code: b.code, packages: b.packages });
        }
      });
    }
    const withTasks = [
      ...(m.tasks || []).map(t => [`${meta.id}/${m.id}/${t.id}`, t]),
      ...((m.exam && m.exam.tasks) || []).map((t, i) => [`${meta.id}/${m.id}/exam${i}`, t]),
    ];
    for (const [key, task] of withTasks) {
      if (task.kind !== 'python' || !task.packages || !task.packages.length) continue;
      const solution = solutionFor(key);
      if (!solution) { items.push({ name: key, missing: true }); continue; }
      items.push({ name: key, code: solution, tests: task.tests, packages: task.packages });
    }
  }
}

if (!items.length) { console.log('Пакеты Python: нечего проверять'); process.exit(0); }

const noSolution = items.filter(i => i.missing);
if (noSolution.length) {
  console.log('ПРОБЛЕМЫ: нет эталонного решения для ' + noSolution.map(i => i.name).join(', '));
  process.exit(1);
}

/* ---------- headless Chrome ---------- */
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.log('ПРОПУЩЕНО: не найден Chrome или Edge'); process.exit(2); }

const PORT = 9500 + Math.floor(Math.random() * 150);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-pylib-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' });
const bye = () => {
  try { chrome.kill(); } catch (e) {}
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
};
process.on('exit', bye);

let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl;
  } catch (e) {}
  if (!wsUrl) await new Promise(r => setTimeout(r, 250));
}
const ws = new WebSocket(wsUrl);
await new Promise(r => { ws.onopen = r; });
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, m => m.error ? rej(new Error(m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetId } = await send('Target.createTarget', { url: BASE });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Runtime.enable'); await S('Page.enable');

const ev = async (expr, t = 600000) => {
  const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout: t });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || '').slice(0, 300));
  return r.result.value;
};

/* Ждём, пока страница поднимет раннеры */
let ready = false;
for (let i = 0; i < 120 && !ready; i++) {
  try { ready = await ev('!!(window.PyRunner && window.PyRunner.run)', 10000); } catch (e) {}
  if (!ready) await new Promise(r => setTimeout(r, 500));
}
if (!ready) { console.log('PyRunner не поднялся на ' + BASE); ws.close(); bye(); process.exit(1); }

const fails = [];
let ok = 0;

for (const item of items) {
  const call = 'window.PyRunner.run(' + JSON.stringify(item.code) + ', ' +
    JSON.stringify(item.tests || '') + ', [], null, ' + JSON.stringify(item.packages) + ')';
  let res;
  try { res = await ev('(async () => JSON.stringify(await ' + call + '))()'); }
  catch (e) { fails.push([item.name, 'СБОЙ: ' + e.message]); continue; }

  const r = JSON.parse(res);
  if (r.err) { fails.push([item.name, 'ОШИБКА: ' + String(r.err).replace(/\s+/g, ' ').slice(0, 160)]); continue; }
  if (r.test_err) { fails.push([item.name, 'ТЕСТ УПАЛ: ' + String(r.test_err).slice(0, 160)]); continue; }
  ok++;
}

ws.close(); bye();

if (fails.length) {
  console.log('ПРОБЛЕМЫ (' + fails.length + ' из ' + items.length + '):');
  fails.forEach(([n, m]) => console.log(' -', n, '->', m));
  process.exit(1);
}
console.log('Пакеты Python: ' + ok + ' фрагментов и задач выполнены в Pyodide ✔');
