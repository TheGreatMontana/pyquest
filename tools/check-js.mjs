/**
 * check-js.mjs — прогон JavaScript-фрагментов и задач.
 *
 * Логика проверки повторяет js/jsrunner.js: тот же контракт assert/equal/stdout,
 * поэтому зелёный тест здесь означает, что задача решаема и в браузере.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '.out');
const items = JSON.parse(fs.readFileSync(path.join(OUT, 'js-items.json'), 'utf8'));

/* Эталонные решения JS-задач: ключ — путь из валидатора */
const SOLUTIONS = {
  'javascript-basics/js-01.task[t1]': "const name = 'Азиз';\nconsole.log(`Привет, ${name}!`);",
  'javascript-basics/js-01.task[t2]': "function sumEven(nums) {\n  return nums.filter(n => n % 2 === 0).reduce((s, n) => s + n, 0);\n}\nconsole.log(sumEven([1,2,3,4,5,6]));",
  'javascript-basics/js-01.task[t3]': "function topPlayer(players) {\n  if (players.length === 0) return null;\n  return players.reduce((best, p) => p.score > best.score ? p : best).name;\n}\nconsole.log(topPlayer([{name:'A',score:1}]));",
  'javascript-basics/js-01.exam.task0': "function wordCount(text) {\n  const counts = {};\n  const words = text.toLowerCase().split(' ').filter(w => w.length > 0);\n  for (const w of words) counts[w] = (counts[w] || 0) + 1;\n  return counts;\n}\nconsole.log(wordCount('JS это JS'));",

  'javascript-basics/js-02.task[t1]': "function grade(score) {\n  if (score >= 90) return 'A';\n  if (score >= 80) return 'B';\n  if (score >= 70) return 'C';\n  return 'F';\n}\nconsole.log(grade(95));",
  'javascript-basics/js-02.task[t2]': "function sumTo(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) total += i;\n  return total;\n}\nconsole.log(sumTo(5));",
  'javascript-basics/js-02.task[t3]': "function firstBigger(arr, limit) {\n  for (const x of arr) if (x > limit) return x;\n  return null;\n}\nconsole.log(firstBigger([1, 5, 9], 4));",
  'javascript-basics/js-02.exam.task0': "function fizzbuzz(n) {\n  const out = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) out.push('FizzBuzz');\n    else if (i % 3 === 0) out.push('Fizz');\n    else if (i % 5 === 0) out.push('Buzz');\n    else out.push(String(i));\n  }\n  return out;\n}\nconsole.log(fizzbuzz(15).join(' '));",

  'javascript-basics/js-03.task[t1]': "function makeCounter() {\n  let count = 0;\n  return function () { count += 1; return count; };\n}\nconst next = makeCounter();\nconsole.log(next(), next());",
  'javascript-basics/js-03.task[t2]': "function fact(n) {\n  return n <= 1 ? 1 : n * fact(n - 1);\n}\nconsole.log(fact(5));",
  'javascript-basics/js-03.task[t3]': "function twice(fn, value) {\n  return fn(fn(value));\n}\nconsole.log(twice(x => x * 2, 5));",
  'javascript-basics/js-03.exam.task0': "function once(fn) {\n  let called = false, result;\n  return function (...args) {\n    if (!called) { called = true; result = fn(...args); }\n    return result;\n  };\n}\nconst init = once(() => 'готово');\nconsole.log(init(), init());",

  'javascript-basics/js-04.task[t1]': "function wait(ms, value) {\n  return new Promise(resolve => setTimeout(() => resolve(value), ms));\n}\nwait(20, 'готово').then(v => console.log(v));",
  'javascript-basics/js-04.task[t2]': "function fetchOne(x) {\n  return new Promise(r => setTimeout(() => r('элемент ' + x), 5));\n}\nasync function loadAll(items) {\n  const out = [];\n  for (const x of items) out.push(await fetchOne(x));\n  return out;\n}\nloadAll([1, 2]).then(r => console.log(r));",
  'javascript-basics/js-04.task[t3]': "function fetchOne(x) {\n  return new Promise(r => setTimeout(() => r('элемент ' + x), 5));\n}\nasync function loadFast(items) {\n  return Promise.all(items.map(fetchOne));\n}\nloadFast([1, 2]).then(r => console.log(r));",
  'javascript-basics/js-04.exam.task0': "async function retry(fn, times) {\n  let last = null;\n  for (let i = 0; i < times; i++) {\n    try { return await fn(); } catch (e) { last = e; }\n  }\n  throw last;\n}\nlet n = 0;\nretry(async () => { n++; if (n < 2) throw new Error('увы'); return 'ок'; }, 3)\n  .then(r => console.log(r, 'с попытки', n));",
};

const fails = [];
let executed = 0, checked = 0;

async function runOne(code, tests) {
  const out = [];
  const fmt = (v) => {
    if (typeof v === 'string') return v;
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  };
  const fakeConsole = {
    log: (...a) => out.push(a.map(fmt).join(' ')),
    error: (...a) => out.push(a.map(fmt).join(' ')),
    warn: (...a) => out.push(a.map(fmt).join(' ')),
    info: (...a) => out.push(a.map(fmt).join(' ')),
  };

  const fn = new Function('console', code);
  fn(fakeConsole);

  /* Асинхронный код печатает уже после синхронной части — ждём столько же,
     сколько ждёт браузерный раннер, иначе вывод промиса потеряется. */
  await new Promise(r => setTimeout(r, 250));

  if (tests) {
    const assert = (cond, message) => { if (!cond) throw new Error(message || 'Проверка не пройдена'); };
    const equal = (actual, expected, message) => {
      const a = JSON.stringify(actual), b = JSON.stringify(expected);
      if (a !== b) throw new Error((message || 'Ожидалось') + ': ' + b + ', а получено: ' + a);
    };
    /* AsyncFunction — чтобы в тестах работал await: асинхронную задачу
       иначе не проверить. Ровно так же устроен браузерный раннер. */
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const testFn = new AsyncFunction('assert', 'equal', 'stdout', 'console', code + '\n' + tests);
    await testFn(assert, equal, out.join('\n'), fakeConsole);
  }
  return out.join('\n');
}

for (const item of items) {
  /* Фрагменты уроков: просто выполняем и смотрим, что не падают */
  if (item.code !== undefined) {
    try {
      if (item.syntaxOnly) new Function(item.code);       // predict-код: проверяем разбор
      else { await runOne(item.code, ''); executed++; }
    } catch (e) {
      fails.push([item.name, (item.syntaxOnly ? 'СИНТАКСИС: ' : 'ВЫПОЛНЕНИЕ: ') + e.message]);
    }
    continue;
  }

  /* Задачи: прогоняем эталонное решение через тесты задачи */
  if (item.tests !== undefined) {
    const sol = SOLUTIONS[item.name];
    if (sol === undefined) { fails.push([item.name, 'НЕТ ЭТАЛОННОГО РЕШЕНИЯ']); continue; }
    try {
      await runOne(sol, item.tests);
      checked++;
    } catch (e) {
      fails.push([item.name, 'ТЕСТ УПАЛ: ' + e.message]);
    }
  }
}

if (fails.length) {
  console.log('ПРОБЛЕМЫ (' + fails.length + ' из ' + items.length + '):');
  fails.forEach(([n, m]) => console.log(' -', n, '->', m));
  process.exit(1);
}
console.log('JavaScript: ' + executed + ' фрагментов выполнено, ' + checked + ' эталонных решений прошли тесты ✔');
