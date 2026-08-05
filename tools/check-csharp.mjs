/**
 * check-csharp.mjs — прогон C# через настоящий Roslyn в браузере.
 *
 * Рантайм — Blazor WebAssembly (runtime/csharp-src), выложенный на сайт статикой.
 * Живёт он только в браузере, поэтому тест поднимает headless Chrome и
 * разговаривает со страницей рантайма напрямую.
 *
 *   node tools/check-csharp.mjs [url]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const items = JSON.parse(fs.readFileSync(path.join(HERE, '.out', 'csharp-items.json'), 'utf8'));
const BASE = (process.argv[2] || 'https://course.azizbek-azimov.uz/').replace(/\/$/, '') + '/';
if (!items.length) { console.log('C#: нечего проверять'); process.exit(0); }

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.log('ПРОПУЩЕНО: не найден Chrome или Edge'); process.exit(2); }

const PORT = 9800 + Math.floor(Math.random() * 150);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-cs-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' });
const bye = () => { try { chrome.kill(); } catch (e) {} try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {} };
process.on('exit', bye);

let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl; } catch (e) {}
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
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Runtime.enable'); await S('Page.enable');
await S('Page.navigate', { url: BASE + 'dotnet/index.html' });

const ev = async (expr, t = 300000) => {
  const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout: t });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || '').slice(0, 200));
  return r.result.value;
};

/* Blazor поднимается небыстро: 12 МБ рантайма плюс запуск среды */
let ready = false;
for (let i = 0; i < 180 && !ready; i++) {
  try { ready = await ev('window.__csReady === true', 10000); } catch (e) {}
  if (!ready) await new Promise(r => setTimeout(r, 1000));
}
if (!ready) { console.log('рантайм C# не поднялся на ' + BASE + 'dotnet/'); ws.close(); bye(); process.exit(1); }

const norm = (s) => String(s == null ? '' : s)
  .replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

const run = async (code) => {
  const raw = await ev('DotNet.invokeMethodAsync("CsRunner", "Run", ' + JSON.stringify(code) + ')', 180000);
  return JSON.parse(raw);
};

const fails = [];
let compiled = 0, checked = 0;

/* Сначала убеждаемся, что рантайм вообще считает и честно ругается на ошибки */
const smoke = await run('using System;\nclass P { static void Main() { Console.WriteLine(6 * 7); } }');
if (norm(smoke.out) !== '42') fails.push(['дымовой тест', 'ожидали 42, получили ' + JSON.stringify(smoke)]);

const broken = await run('class P { static void Main() { int x = "строка"; } }');
if (!broken.err) fails.push(['ошибка компиляции', 'ожидали диагностику, а её нет']);

for (const item of items) {
  let res;
  try { res = await run(item.code); }
  catch (e) { fails.push([item.name, 'СБОЙ: ' + e.message]); continue; }

  if (res.err && item.expected !== undefined) {
    fails.push([item.name, 'НЕ СОБРАЛОСЬ: ' + String(res.err).replace(/\s+/g, ' ').slice(0, 120)]);
    continue;
  }
  compiled++;
  if (item.expected === undefined) continue;

  if (norm(res.out) !== norm(item.expected)) {
    fails.push([item.name, 'ВЫВОД НЕ СОВПАЛ\n     получено: ' + JSON.stringify(norm(res.out)) +
                           '\n     ожидалось: ' + JSON.stringify(norm(item.expected))]);
  } else checked++;
}

ws.close(); bye();

if (fails.length) {
  console.log('ПРОБЛЕМЫ (' + fails.length + '):');
  fails.forEach(([n, m]) => console.log(' -', n, '->', m));
  process.exit(1);
}
console.log('C#: ' + compiled + ' фрагментов собрано Roslyn, ' + checked + ' эталонов дали ожидаемый вывод ✔');
