/**
 * shots.mjs — снимки экранов живого сайта.
 *
 * Дизайн нельзя чинить вслепую: скрипт открывает реальные страницы в headless
 * Chrome и складывает PNG в tools/.shots, чтобы на них можно было посмотреть.
 *
 *   node tools/shots.mjs [url]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '.shots');
const URL_ = (process.argv[2] || 'https://course.azizbek-azimov.uz/').replace(/\/$/, '') + '/';
fs.mkdirSync(OUT, { recursive: true });

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.log('нет Chrome'); process.exit(2); }

const PORT = 9600 + Math.floor(Math.random() * 300);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-shot-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
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
await S('Runtime.enable'); await S('Page.enable'); await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const ev = async (expr, t = 30000) => {
  const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout: t });
  return r.exceptionDetails ? null : r.result.value;
};

/* Входим демо-аккаунтом: снимки нужны про интерфейс, а не про чужие данные */
const TOKEN = fs.readFileSync(path.join(OUT, 'token.txt'), 'utf8').trim();
await S('Page.navigate', { url: URL_ });
await new Promise(r => setTimeout(r, 2500));
await ev(`localStorage.setItem('pyquest_auth', JSON.stringify({username:'uidemo', token:${JSON.stringify(TOKEN)}}));
  localStorage.setItem('pyquest_last_user','uidemo');`);

/* Немного прогресса, иначе экраны пустые и по ним не судить о вёрстке */
await ev(`localStorage.setItem('pyquest_state', JSON.stringify({
  v:2, xp:640, streak:4, lastDay:new Date().toISOString().slice(0,10),
  mods:{ 'python-basics/pb-01':{theory:true,quizBest:100,examBest:90,tasks:{t1:true,t2:true},blocks:{}},
         'python-basics/pb-02':{theory:true,quizBest:80,examBest:75,tasks:{t1:true},blocks:{}} },
  finals:{}, ach:['first-steps'], projects:{}, bookmarks:[], recent:[], path:'de-path', langs:['python']
}))`);
await S('Page.navigate', { url: URL_ });
await new Promise(r => setTimeout(r, 3000));

const PAGES = [
  ['01-dashboard', '#/'],
  ['02-catalog', '#/catalog'],
  ['03-domain-frontend', '#/domain/frontend'],
  ['10-html-lesson', '#/course/html-basics/module/ht-01/theory'],
  ['11-css-task', '#/course/css-basics/module/cs-01/tasks/t2'],
  ['04-domain-de', '#/domain/data-engineering'],
  ['05-course-python', '#/course/python-basics'],
  ['06-lesson', '#/course/python-basics/module/pb-01/theory'],
  ['07-tasks', '#/course/c-basics/module/c-01/tasks'],
  ['08-roadmap', '#/roadmap'],
  ['09-projects', '#/projects'],
];

for (const [name, hash] of PAGES) {
  await S('Page.navigate', { url: URL_ + hash });
  await new Promise(r => setTimeout(r, 1200));
  await ev('location.hash = ' + JSON.stringify(hash));
  await new Promise(r => setTimeout(r, 1800));
  const { data } = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(data, 'base64'));
  console.log('снято:', name);
}

/* Мобильная ширина — отдельно */
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
for (const [name, hash] of [['m1-dashboard', '#/'], ['m2-catalog', '#/catalog'], ['m3-lesson', '#/course/python-basics/module/pb-01/theory']]) {
  await ev('location.hash = ' + JSON.stringify(hash));
  await new Promise(r => setTimeout(r, 1800));
  const { data } = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(data, 'base64'));
  console.log('снято (мобайл):', name);
}

ws.close(); bye();
console.log('готово:', OUT);
