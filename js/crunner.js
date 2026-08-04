/**
 * crunner.js — компиляция и запуск C и C++ прямо в браузере.
 *
 * Внутри — настоящий clang 8 и wasm-ld, собранные в WebAssembly (проект
 * binji/wasm-clang, Apache 2.0). Код студента компилируется в wasm-модуль
 * и исполняется здесь же: сервер в этом не участвует вообще.
 *
 * Всё живёт в Worker'е: бесконечный цикл убивается terminate(), вкладка цела.
 * Ассеты (~58 МБ) грузятся один раз и кэшируются браузером на год.
 */
(function () {
  const BASE = 'wasm/';
  const LOAD_MS = 180000;   // первая загрузка: 58 МБ на медленной сети
  const BUILD_MS = 60000;   // компиляция и линковка
  const RUN_MS = 10000;     // выполнение программы студента

  const WORKER_SRC = `
importScripts('${'BASE_PLACEHOLDER'}shared.js');

let api = null;
let compatObj = null;
let phase = 'idle';
let buf = '';

const write = (s) => { buf += s; };
const strip = (s) => s.replace(/\\x1b\\[[0-9;]*m/g, '');

/* Рантайм читает байты вывода через String.fromCharCode, то есть как Latin-1.
   Возвращаем их обратно в UTF-8, иначе «Привет» приедет кракозябрами. */
const utf8 = (s) => new TextDecoder('utf-8').decode(Uint8Array.from(s, c => c.charCodeAt(0) & 0xFF));
/* Симметрично на входе: addFile обрезает каждый символ строки до одного байта,
   поэтому исходник отдаём уже закодированным. */
const bytes = (s) => new TextEncoder().encode(s);

/* Недостающие в sysroot softfloat-builtins для long double.
   Без них libc++ не линкуется, как только подключаешь <algorithm>. */
const COMPAT_SRC = [
  'typedef long double tf;',
  'static int cmp(tf a, tf b) { return a < b ? -1 : (a > b ? 1 : 0); }',
  'int __eqtf2(tf a, tf b) { return cmp(a, b) != 0; }',
  'int __netf2(tf a, tf b) { return cmp(a, b) != 0; }',
  'int __lttf2(tf a, tf b) { return cmp(a, b); }',
  'int __letf2(tf a, tf b) { return cmp(a, b); }',
  'int __gttf2(tf a, tf b) { return cmp(a, b); }',
  'int __getf2(tf a, tf b) { return cmp(a, b); }',
  'int __unordtf2(tf a, tf b) { return a != a || b != b; }',
].join('\\n');

async function boot() {
  if (api) return api;
  phase = 'load';
  self.postMessage({ status: 'load' });
  api = new API({
    readBuffer: (name) => fetch('${'BASE_PLACEHOLDER'}' + name).then(r => r.arrayBuffer()),
    compileStreaming: (name) => WebAssembly.compileStreaming(fetch('${'BASE_PLACEHOLDER'}' + name)),
    hostWrite: write,
    clang: 'clang.wasm',
    lld: 'lld.wasm',
    memfs: 'memfs.wasm',
    sysroot: 'sysroot.tar',
  });
  await api.ready;

  /* compat.o собираем один раз за сессию тем же clang */
  buf = '';
  api.memfs.addFile('compat.c', bytes(COMPAT_SRC));
  const clang = await api.getModule(api.clangFilename);
  await api.run(clang, 'clang', '-cc1', '-emit-obj', ...api.clangCommonArgs,
                '-O0', '-fno-builtin', '-o', 'compat.o', '-x', 'c', 'compat.c');
  /* Копия, а не view: getFileContents смотрит прямо в память WASM, и при её
     росте на следующей сборке буфер отцепляется вместе с нашими байтами. */
  compatObj = new Uint8Array(api.memfs.getFileContents('compat.o'));
  return api;
}

/* Фрагмент без main() оборачиваем в готовую программу: в уроках удобно
   показывать три строки, а компилятору нужна полноценная единица трансляции. */
function wrap(code, lang) {
  if (/\\bmain\\s*\\(/.test(code)) return code;
  const head = lang === 'c'
    ? '#include <stdio.h>\\n#include <stdlib.h>\\n#include <string.h>\\nint main(void) {\\n'
    : '#include <iostream>\\n#include <vector>\\n#include <string>\\n#include <map>\\nusing namespace std;\\nint main() {\\n';
  return head + code + '\\nreturn 0;\\n}\\n';
}

async function build(code, lang) {
  await boot();
  const src = lang === 'c' ? 'main.c' : 'main.cc';
  api.memfs.addFile('compat.o', compatObj);
  api.memfs.addFile(src, bytes(wrap(code, lang)));

  phase = 'build';
  self.postMessage({ status: 'build' });

  buf = '';
  const clang = await api.getModule(api.clangFilename);
  await api.run(clang, 'clang', '-cc1', '-emit-obj', ...api.clangCommonArgs,
                '-O2', '-o', 'main.o', '-x', lang === 'c' ? 'c' : 'c++', src);

  const lld = await api.getModule(api.lldFilename);
  await api.run(lld, 'wasm-ld', '--no-threads', '--export-dynamic',
                '-z', 'stack-size=1048576', '-Llib/wasm32-wasi',
                'lib/wasm32-wasi/crt1.o', 'main.o', 'compat.o',
                '-lc', '-lc++', '-lc++abi', '-lcanvas', '-o', 'main.wasm');

  return WebAssembly.compile(new Uint8Array(api.memfs.getFileContents('main.wasm')));
}

self.onmessage = async function (e) {
  const { code, lang } = e.data;
  let mod;
  try {
    mod = await build(code, lang);
  } catch (err) {
    /* Диагностика компилятора ценнее текста исключения: её и показываем */
    const diag = strip(utf8(buf)).split('\\n')
      .filter(l => l && !l.startsWith('> ') && !/^\\s*$/.test(l))
      .join('\\n').trim();
    self.postMessage({ out: '', err: diag || err.message, stage: phase });
    return;
  }

  phase = 'run';
  self.postMessage({ status: 'run' });
  buf = '';
  try {
    await api.run(mod, 'main.wasm');
    self.postMessage({ out: strip(utf8(buf)).replace(/^> main\\.wasm\\n?/, ''), err: null });
  } catch (err) {
    const out = strip(utf8(buf)).replace(/^> main\\.wasm\\n?/, '');
    /* Ненулевой код возврата — это не сбой платформы, а результат программы */
    const m = /code (\\d+)/.exec(err.message || '');
    self.postMessage({
      out,
      err: m && m[1] !== '0' ? 'Программа завершилась с кодом ' + m[1] : (err.message || String(err)),
      exit: m ? Number(m[1]) : null,
    });
  }
};
`.replace(/BASE_PLACEHOLDER/g, BASE);

  let blobUrl = null;
  function workerUrl() {
    if (!blobUrl) blobUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    return blobUrl;
  }

  /* Прогретый воркер живёт между запусками: заново тянуть 58 МБ незачем */
  let warm = null;
  let busy = false;

  function run(code, lang, _stdin, onStatus) {
    return new Promise((resolve) => {
      if (busy && warm) { try { warm.terminate(); } catch (e) {} warm = null; }
      const w = warm || new Worker(workerUrl());
      warm = w;
      busy = true;

      let timer = null;
      const arm = (ms) => { clearTimeout(timer); timer = setTimeout(kill, ms); };

      function done(res) {
        clearTimeout(timer);
        busy = false;
        w.onmessage = null;
        w.onerror = null;
        resolve(res);
      }
      function kill() {
        try { w.terminate(); } catch (e) {}
        warm = null;
        done({ out: '', err: 'Превышено время выполнения. Проверь, нет ли бесконечного цикла.' });
      }

      w.onmessage = (e) => {
        const d = e.data;
        if (d.status) {
          if (onStatus) onStatus(d.status);
          arm(d.status === 'load' ? LOAD_MS : d.status === 'build' ? BUILD_MS : RUN_MS);
          return;
        }
        done(d);
      };
      w.onerror = (e) => {
        warm = null;
        done({ out: '', err: 'Сбой рантайма компилятора: ' + (e.message || 'неизвестная ошибка') });
      };

      arm(LOAD_MS);
      w.postMessage({ code, lang });
    });
  }

  window.CRunner = {
    run,
    ensure: () => Promise.resolve(),
    isReady: () => !!warm,
  };
})();
