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
};

const fails = [];
let executed = 0, checked = 0;

function runOne(code, tests) {
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

  if (tests) {
    const assert = (cond, message) => { if (!cond) throw new Error(message || 'Проверка не пройдена'); };
    const equal = (actual, expected, message) => {
      const a = JSON.stringify(actual), b = JSON.stringify(expected);
      if (a !== b) throw new Error((message || 'Ожидалось') + ': ' + b + ', а получено: ' + a);
    };
    const testFn = new Function('assert', 'equal', 'stdout', 'console', code + '\n' + tests);
    testFn(assert, equal, out.join('\n'), fakeConsole);
  }
  return out.join('\n');
}

for (const item of items) {
  /* Фрагменты уроков: просто выполняем и смотрим, что не падают */
  if (item.code !== undefined) {
    try {
      if (item.syntaxOnly) new Function(item.code);       // predict-код: проверяем разбор
      else { runOne(item.code, ''); executed++; }
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
      runOne(sol, item.tests);
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
