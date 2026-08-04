/**
 * check-web.mjs — проверка задач и примеров по HTML, CSS и Tailwind.
 *
 * Вёрстку проверяет только браузер: вычисленные стили, размеры, шкала Tailwind.
 * Поэтому тест поднимает headless Chrome и прогоняет всё через тот же
 * js/webrunner.js, что работает у студента.
 *
 *   node tools/check-web.mjs [url]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const items = JSON.parse(fs.readFileSync(path.join(HERE, '.out', 'web-items.json'), 'utf8'));
const URL_ = process.argv[2] || 'https://course.azizbek-azimov.uz/';
if (!items.length) { console.log('Вёрстка: нечего проверять'); process.exit(0); }

/* Эталонные решения задач по вёрстке: ключ — путь из валидатора */
const SOLUTIONS = {
  'html-basics/ht-01.task[t1]': '<h1>Азиз</h1>\n<p>Учусь верстать.</p>',
  'html-basics/ht-01.task[t2]': '<ul>\n <li>Один</li>\n <li>Два</li>\n <li>Три</li>\n</ul>\n<a href="https://developer.mozilla.org">MDN</a>',
  'html-basics/ht-01.task[t3]': '<header><h1>Сайт</h1><nav><a href="#">Главная</a><a href="#">Блог</a></nav></header>\n<main><p>Текст</p></main>\n<footer>© 2026</footer>',
  'html-basics/ht-01.exam.task0': '<article><h2>Заголовок</h2><p>Текст статьи</p><img src="cat.jpg" alt="Кот"></article>',
  'html-basics/ht-02.task[t1]': '<form>\n <label for="mail">Почта</label>\n <input id="mail" type="email">\n <button type="submit">Подписаться</button>\n</form>',
  'html-basics/ht-02.task[t2]': '<table>\n <thead><tr><th>Курс</th><th>Модулей</th></tr></thead>\n <tbody>\n  <tr><td>HTML</td><td>2</td></tr>\n  <tr><td>CSS</td><td>2</td></tr>\n </tbody>\n</table>',
  'html-basics/ht-02.task[t3]': '<article>\n <h2>Карточка</h2>\n <img src="cat.jpg" alt="Кот">\n <button>Открыть</button>\n</article>',
  'html-basics/ht-02.exam.task0': '<form>\n <label for="nm">Имя</label><input id="nm" type="text">\n <label for="em">Почта</label><input id="em" type="email">\n <label for="msg">Сообщение</label><textarea id="msg"></textarea>\n <button type="submit">Отправить</button>\n</form>',
  'css-basics/cs-01.task[t1]': 'h1 { color: red; }\np { font-size: 20px; }',
  'css-basics/cs-01.task[t2]': '.card { padding: 16px; border: 2px solid blue; border-radius: 8px; box-sizing: border-box; }',
  'css-basics/cs-01.task[t3]': '.header { display: flex; justify-content: space-between; align-items: center; gap: 10px; }',
  'css-basics/cs-01.exam.task0': '.btn { color: white; background: #2563eb; padding: 12px; border-radius: 6px; cursor: pointer; }',
  'css-basics/cs-02.task[t1]': '.gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }',
  'css-basics/cs-02.task[t2]': ':root { --main: #16a34a; }\n.tag { background: var(--main); color: white; }',
  'css-basics/cs-02.task[t3]': '.cta { background: #7c3aed; border-radius: 8px; transition: all 0.3s; }',
  'css-basics/cs-02.exam.task0': '.list { display: grid; grid-template-columns: 1fr; gap: 16px; }\n@media (min-width: 600px) { .list { grid-template-columns: repeat(2, 1fr); } }',
  'tailwind-basics/tw-01.task[t1]': '<button class="bg-blue-600 text-white px-4 py-2 rounded-lg">Отправить</button>',
  'tailwind-basics/tw-01.task[t2]': '<header class="flex justify-between items-center p-4"><span>Логотип</span><span>Меню</span></header>',
  'tailwind-basics/tw-01.task[t3]': '<div class="max-w-sm mx-auto bg-white rounded-xl p-6"><h2 class="text-xl font-bold">Заголовок</h2></div>',
  'tailwind-basics/tw-01.exam.task0': '<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="p-4">Одна</div><div class="p-4">Две</div><div class="p-4">Три</div></div>',
};

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.log('ПРОПУЩЕНО: не найден Chrome или Edge'); process.exit(2); }

const PORT = 9700 + Math.floor(Math.random() * 200);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-web-'));
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
await S('Page.navigate', { url: URL_ });

const ev = async (expr, t = 60000) => {
  const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout: t });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || '').slice(0, 200));
  return r.result.value;
};

let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  try { ready = await ev('document.readyState === "complete" && !!window.WebRunner', 10000); } catch (e) {}
  if (!ready) await new Promise(r => setTimeout(r, 500));
}
if (!ready) { console.log('раннер вёрстки не поднялся на ' + URL_); ws.close(); bye(); process.exit(1); }

/* Контейнер под предпросмотр — вне видимой части страницы, но с реальными размерами:
   иначе flex и grid посчитаются на нулевой ширине. */
await ev(`(() => { let d = document.getElementById('__pqbox');
  if (!d) { d = document.createElement('div'); d.id = '__pqbox';
    d.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:600px';
    document.body.appendChild(d); }
  return true; })()`);

function runOne(kind, code, extra, tests) {
  const payload = JSON.stringify({ kind, code, extra: extra || null, tests: tests || null });
  return ev(`new Promise(res => {
    const p = ${payload};
    const box = document.getElementById('__pqbox');
    if (!p.tests) {
      window.WebRunner.render(box, p.kind, p.code, p.extra, null, null);
      /* Без проверок достаточно, что документ собрался и отрисовался */
      setTimeout(() => res(JSON.stringify({ ok: true })), 400);
      return;
    }
    window.WebRunner.render(box, p.kind, p.code, p.extra, p.tests, r => res(JSON.stringify(r)));
  })`, 60000);
}

const fails = [];
let rendered = 0, checked = 0;

for (const item of items) {
  const isTask = item.tests !== undefined && item.code === undefined;
  const code = isTask ? SOLUTIONS[item.name] : item.code;
  if (isTask && code === undefined) { fails.push([item.name, 'НЕТ ЭТАЛОННОГО РЕШЕНИЯ']); continue; }

  let res;
  try { res = JSON.parse(await runOne(item.kind, code, { html: item.html, css: item.css }, item.tests)); }
  catch (e) { fails.push([item.name, 'СБОЙ: ' + e.message]); continue; }

  if (!res.ok) fails.push([item.name, 'ПРОВЕРКА НЕ ПРОШЛА: ' + (res.err || 'без причины')]);
  else if (isTask) checked++;
  else rendered++;
}

ws.close(); bye();

if (fails.length) {
  console.log('ПРОБЛЕМЫ (' + fails.length + ' из ' + items.length + '):');
  fails.forEach(([n, m]) => console.log(' -', n, '->', m));
  process.exit(1);
}
console.log('Вёрстка: ' + rendered + ' примеров отрисовано, ' + checked + ' эталонов прошли проверки ✔');
