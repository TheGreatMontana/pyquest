/**
 * check-java.mjs — прогон Java через настоящую JVM.
 *
 * Java компилируется ecj и исполняется CheerpJ, а это работает только в
 * браузере. Поэтому тест поднимает headless Chrome, открывает сайт и гоняет
 * эталонные решения там же, где их будет запускать студент.
 *
 *   node tools/check-java.mjs [url]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const items = JSON.parse(fs.readFileSync(path.join(HERE, '.out', 'java-items.json'), 'utf8'));
const URL_ = process.argv[2] || 'https://course.azizbek-azimov.uz/';

if (!items.length) { console.log('Java: нечего проверять'); process.exit(0); }

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.log('ПРОПУЩЕНО: не найден Chrome или Edge'); process.exit(2); }

const PORT = 9300 + Math.floor(Math.random() * 500);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-java-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' });
const cleanup = () => {
  try { chrome.kill(); } catch (e) {}
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
};
process.on('exit', cleanup);

let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl; }
  catch (e) { /* ещё поднимается */ }
  if (!wsUrl) await new Promise(r => setTimeout(r, 250));
}
if (!wsUrl) { console.log('не удалось запустить Chrome'); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('WS')); });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, m => m.error ? rej(new Error(m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Runtime.enable'); await S('Page.enable');
await S('Page.navigate', { url: URL_ });

async function ev(expr, timeout = 300000) {
  const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || '').slice(0, 300));
  return r.result.value;
}

/* Ждём готовности страницы и раннера Java */
let ok = false;
for (let i = 0; i < 120 && !ok; i++) {
  try { ok = await ev('document.readyState === "complete" && !!window.JavaRunner', 10000); } catch (e) {}
  if (!ok) await new Promise(r => setTimeout(r, 500));
}
if (!ok) { console.log('раннер Java не поднялся на ' + URL_); ws.close(); cleanup(); process.exit(1); }

const norm = (s) => String(s == null ? '' : s)
  .replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

const fails = [];
let ran = 0, checked = 0;

for (const item of items) {
  let res;
  try {
    res = await ev(`window.JavaRunner.run(${JSON.stringify(item.code)}, 'java', '', ()=>{}).then(r => JSON.stringify(r))`, 400000);
  } catch (e) {
    fails.push([item.name, 'СБОЙ ЗАПУСКА: ' + e.message]);
    continue;
  }
  const r = JSON.parse(res);
  if (r.err) { fails.push([item.name, 'ОШИБКА: ' + String(r.err).replace(/\s+/g, ' ').slice(0, 200)]); continue; }
  ran++;
  if (item.expected === undefined) continue;
  if (norm(r.out) !== norm(item.expected)) {
    fails.push([item.name, 'ВЫВОД НЕ СОВПАЛ\n     получено: ' + JSON.stringify(norm(r.out)) +
                           '\n     ожидалось: ' + JSON.stringify(norm(item.expected))]);
  } else checked++;
}

ws.close(); cleanup();

if (fails.length) {
  console.log('ПРОБЛЕМЫ (' + fails.length + ' из ' + items.length + '):');
  fails.forEach(([n, m]) => console.log(' -', n, '->', m));
  process.exit(1);
}
console.log('Java: ' + ran + ' фрагментов собрано и запущено, ' + checked + ' эталонов дали ожидаемый вывод ✔');
