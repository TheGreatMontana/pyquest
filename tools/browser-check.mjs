/**
 * browser-check.mjs — проверка сайта в настоящем Chrome.
 *
 * Node-тесты проверяют логику, но раннеры живут в браузере: Worker, fetch,
 * WebAssembly.compileStreaming, MIME-типы от nginx. Здесь поднимается headless
 * Chrome, открывается боевой сайт и внутри него реально запускается код.
 *
 * Puppeteer не нужен: общаемся с Chrome по DevTools Protocol через встроенный
 * в Node WebSocket.
 *
 *   node tools/browser-check.mjs [url]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const URL_ = process.argv[2] || 'https://course.azizbek-azimov.uz/';
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p));

if (!CHROME) { console.log('ПРОПУЩЕНО: не найден Chrome или Edge'); process.exit(2); }

const PORT = 9222 + Math.floor(Math.random() * 500);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-chrome-'));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE, 'about:blank',
], { stdio: 'ignore' });

const cleanup = () => {
  try { chrome.kill(); } catch (e) {}
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
};
process.on('exit', cleanup);

async function targetUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch (e) { /* Chrome ещё поднимается */ }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Chrome не открыл порт отладки');
}

const ws = new WebSocket(await targetUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('WS не подключился')); });

let msgId = 0;
const pending = new Map();
const events = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) events.push(m);
};
function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, (m) => m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result));
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

/* Отдельная вкладка со своей сессией */
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S('Runtime.enable');
await S('Page.enable');
await S('Runtime.consoleAPICalled' in {} ? 'Log.enable' : 'Log.enable').catch(() => {});
await S('Page.navigate', { url: URL_ });

async function evaluate(expression, timeoutMs = 300000) {
  const r = await S('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true, timeout: timeoutMs,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'ошибка в странице');
  return r.result.value;
}

/* Ждём не «сколько-нибудь секунд», а фактической готовности: документ загружен
   и все раннеры объявлены. Иначе тест мигает на медленной сети. */
async function waitReady(ms = 60000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const st = await evaluate(
        'JSON.stringify({r: document.readyState, py: !!window.PyRunner, js: !!window.JsRunner, c: !!window.CRunner, sql: !!window.SqlRunner})',
        10000);
      const s = JSON.parse(st);
      if (s.r === 'complete' && s.py && s.js && s.c && s.sql) return s;
    } catch (e) { /* страница ещё перезагружается */ }
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

const checks = [];
const check = (name, ok, detail) => {
  checks.push([name, ok, detail]);
  console.log((ok ? '✔ ' : '✘ ') + name + (detail ? '\n   ' + String(detail).replace(/\n/g, '\n   ') : ''));
};

/* --- страница вообще ожила --- */
const ready = await waitReady();
const title = await evaluate('document.title');
check('страница загрузилась', !!title, 'title: ' + title);
check('раннеры подключены', !!ready, ready ? JSON.stringify(ready) :
  await evaluate('JSON.stringify({r: document.readyState, py: !!window.PyRunner, js: !!window.JsRunner, c: !!window.CRunner, sql: !!window.SqlRunner})'));
if (!ready) { console.log('\nдальше идти бессмысленно: раннеры не поднялись'); ws.close(); cleanup(); process.exit(1); }

/* --- JavaScript в Worker --- */
const jsOut = await evaluate(`window.JsRunner.run("const a=[1,2,3].map(x=>x*2); console.log(a.join(','));", '', [], ()=>{}).then(r => JSON.stringify(r))`, 60000);
check('JavaScript выполняется', /2,4,6/.test(jsOut), jsOut);

/* --- C: настоящая компиляция clang в браузере --- */
const cCode = `#include <stdio.h>
int main(void){ int a=5,b=7,*p=&a; *p=99; printf("a=%d b=%d\\\\n",a,b); return 0; }`;
const cOut = await evaluate(`window.CRunner.run(${JSON.stringify(cCode)}, 'c', '', s=>{}).then(r => JSON.stringify(r))`, 400000);
check('C компилируется и запускается', /a=99 b=7/.test(cOut), cOut);

/* --- C++ со STL и кириллицей в выводе --- */
const cppCode = `#include <iostream>
#include <vector>
#include <algorithm>
int main(){ std::vector<int> v{5,3,9,1}; std::sort(v.begin(),v.end());
  for(int x: v) std::cout << x << " ";
  std::cout << "| Привет, Азиз" << std::endl; return 0; }`;
const cppOut = await evaluate(`window.CRunner.run(${JSON.stringify(cppCode)}, 'cpp', '', s=>{}).then(r => JSON.stringify(r))`, 400000);
check('C++ со STL и кириллицей', /1 3 5 9/.test(cppOut) && /Привет, Азиз/.test(cppOut), cppOut);

/* --- ошибка компиляции доходит до студента понятным текстом --- */
const badOut = await evaluate(`window.CRunner.run("int main(){ undefined_call(); return 0 }", 'c', '', s=>{}).then(r => JSON.stringify(r))`, 400000);
check('ошибка компиляции показывается', /error:/.test(badOut) && !/Сбой рантайма/.test(badOut), badOut.slice(0, 220));

/* --- бесконечный цикл не вешает вкладку --- */
const t0 = Date.now();
const loopOut = await evaluate(`window.CRunner.run("int main(){ while(1){} return 0; }", 'c', '', s=>{}).then(r => JSON.stringify(r))`, 400000);
const secs = ((Date.now() - t0) / 1000).toFixed(0);
check('бесконечный цикл прерывается', /Превышено время/.test(loopOut), 'за ' + secs + ' с | ' + loopOut.slice(0, 120));

const errs = events.filter(e => e.method === 'Runtime.exceptionThrown');
check('без исключений на странице', errs.length === 0, errs.length ? JSON.stringify(errs[0]).slice(0, 200) : '');

ws.close();
cleanup();

const failed = checks.filter(c => !c[1]);
console.log('');
if (failed.length) { console.log('ПРОВАЛЫ: ' + failed.length + ' из ' + checks.length); process.exit(1); }
console.log('Браузерный тест: все ' + checks.length + ' проверок пройдены ✔');
