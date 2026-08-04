/**
 * check-clang.mjs — прогон C и C++ через настоящий компилятор.
 *
 * Использует те же clang и wasm-ld, что и браузер (js/crunner.js), поэтому
 * зелёный тест означает: код из уроков компилируется, эталонные решения задач
 * запускаются и печатают ровно тот вывод, который засчитывается студенту.
 *
 * Ассеты компилятора не лежат в репозитории (58 МБ). Если их нет — тест
 * честно сообщает об этом и не притворяется пройденным:
 *   node tools/fetch-wasm.mjs
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WASM = path.join(HERE, '..', 'runtime', 'wasm-clang');
const items = JSON.parse(fs.readFileSync(path.join(HERE, '.out', 'clang-items.json'), 'utf8'));

const NEEDED = ['shared.js', 'clang.wasm', 'lld.wasm', 'memfs.wasm', 'sysroot.tar'];
const missing = NEEDED.filter(f => !fs.existsSync(path.join(WASM, f)));
if (missing.length) {
  console.log('ПРОПУЩЕНО: нет ассетов компилятора (' + missing.join(', ') + ')');
  console.log('Скачать: node tools/fetch-wasm.mjs');
  process.exit(2);
}

const ctx = { WebAssembly, TextDecoder, TextEncoder, console, setTimeout, Date, Math, performance };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(WASM, 'shared.js'), 'utf8') + '\n;globalThis.__API = API;', ctx);
const API = ctx.__API;

const COMPAT = [
  'typedef long double tf;',
  'static int cmp(tf a, tf b) { return a < b ? -1 : (a > b ? 1 : 0); }',
  'int __eqtf2(tf a, tf b) { return cmp(a, b) != 0; }',
  'int __netf2(tf a, tf b) { return cmp(a, b) != 0; }',
  'int __lttf2(tf a, tf b) { return cmp(a, b); }',
  'int __letf2(tf a, tf b) { return cmp(a, b); }',
  'int __gttf2(tf a, tf b) { return cmp(a, b); }',
  'int __getf2(tf a, tf b) { return cmp(a, b); }',
  'int __unordtf2(tf a, tf b) { return a != a || b != b; }',
].join('\n');

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

/* Рантайм собирает вывод программы как Latin-1 (String.fromCharCode на байт),
   поэтому кириллицу возвращаем в UTF-8 обратным преобразованием. */
const utf8 = (s) => new TextDecoder('utf-8').decode(Uint8Array.from(s, c => c.charCodeAt(0) & 0xFF));
/* И наоборот: исходник надо отдать байтами, иначе addFile обрежет каждый
   символ до одного байта и «Ю» превратится в точку. */
const bytes = (s) => new TextEncoder().encode(s);
const norm = (s) => String(s == null ? '' : s)
  .replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

/* Фрагменты уроков без main() — та же обёртка, что и в js/crunner.js */
const HEAD_C = '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\nint main(void) {\n';
const HEAD_CPP = '#include <iostream>\n#include <vector>\n#include <string>\n#include <map>\nusing namespace std;\nint main() {\n';
function wrap(code, lang) {
  if (/\bmain\s*\(/.test(code)) return code;
  return (lang === 'c' ? HEAD_C : HEAD_CPP) + code + '\nreturn 0;\n}\n';
}

let buf = '';
const api = new API({
  readBuffer: (n) => fs.readFileSync(path.join(WASM, n)).buffer,
  compileStreaming: (n) => WebAssembly.compile(fs.readFileSync(path.join(WASM, n))),
  hostWrite: (s) => { buf += s; },
  clang: 'clang.wasm', lld: 'lld.wasm', memfs: 'memfs.wasm', sysroot: 'sysroot.tar',
});
await api.ready;

/* compat.o собирается один раз — как и в браузере */
api.memfs.addFile('compat.c', COMPAT);
const clang = await api.getModule(api.clangFilename);
await api.run(clang, 'clang', '-cc1', '-emit-obj', ...api.clangCommonArgs,
              '-O0', '-fno-builtin', '-o', 'compat.o', '-x', 'c', 'compat.c');
/* Копия, а не view: при росте памяти WASM исходный буфер отцепляется. */
const compatObj = new Uint8Array(api.memfs.getFileContents('compat.o'));

async function build(code, lang) {
  const src = lang === 'c' ? 'main.c' : 'main.cc';
  api.memfs.addFile('compat.o', compatObj);
  api.memfs.addFile(src, bytes(wrap(code, lang)));
  buf = '';
  await api.run(clang, 'clang', '-cc1', '-emit-obj', ...api.clangCommonArgs,
                '-O2', '-o', 'main.o', '-x', lang === 'c' ? 'c' : 'c++', src);
  const lld = await api.getModule(api.lldFilename);
  await api.run(lld, 'wasm-ld', '--no-threads', '--export-dynamic', '-z', 'stack-size=1048576',
                '-Llib/wasm32-wasi', 'lib/wasm32-wasi/crt1.o', 'main.o', 'compat.o',
                '-lc', '-lc++', '-lc++abi', '-lcanvas', '-o', 'main.wasm');
  return WebAssembly.compile(new Uint8Array(api.memfs.getFileContents('main.wasm')));
}

const fails = [];
let compiled = 0, checked = 0;

for (const item of items) {
  let mod;
  try {
    mod = await build(item.code, item.lang);
    compiled++;
  } catch (e) {
    const diag = strip(buf).split('\n').filter(l => /error:/.test(l)).slice(0, 2).join(' | ');
    fails.push([item.name, 'НЕ СОБРАЛОСЬ: ' + (diag || e.message)]);
    continue;
  }
  if (item.expected === undefined) continue;   // фрагмент урока: хватит успешной сборки

  buf = '';
  try {
    await api.run(mod, 'main.wasm');
  } catch (e) {
    fails.push([item.name, 'УПАЛО ПРИ ЗАПУСКЕ: ' + e.message]);
    continue;
  }
  const out = strip(utf8(buf)).replace(/^> main\.wasm\n?/, '');
  if (norm(out) !== norm(item.expected)) {
    fails.push([item.name, 'ВЫВОД НЕ СОВПАЛ\n     получено: ' + JSON.stringify(norm(out)) +
                           '\n     ожидалось: ' + JSON.stringify(norm(item.expected))]);
  } else checked++;
}

if (fails.length) {
  console.log('ПРОБЛЕМЫ (' + fails.length + ' из ' + items.length + '):');
  fails.forEach(([n, m]) => console.log(' -', n, '->', m));
  process.exit(1);
}
console.log('C/C++: ' + compiled + ' фрагментов собрано clang, ' + checked + ' эталонов дали ожидаемый вывод ✔');
