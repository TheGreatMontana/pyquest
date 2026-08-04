/**
 * fetch-wasm.mjs — качает рантайм компилятора C/C++ (проект binji/wasm-clang, Apache 2.0).
 *
 * 58 МБ бинарников в репозитории не нужны: их тянут сюда по требованию —
 * для тестов (tools/check-clang.mjs) и для выкладки на сервер.
 *
 *   node tools/fetch-wasm.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.join(HERE, '..', 'runtime', 'wasm-clang');
const BASE = 'https://binji.github.io/wasm-clang/';

/* На сайте они лежат без расширения; переименовываем в .wasm, чтобы nginx
   отдавал их как application/wasm — иначе compileStreaming откажется читать. */
const FILES = [
  ['shared.js', 'shared.js'],
  ['clang', 'clang.wasm'],
  ['lld', 'lld.wasm'],
  ['memfs', 'memfs.wasm'],
  ['sysroot.tar', 'sysroot.tar'],
];

fs.mkdirSync(DEST, { recursive: true });

for (const [remote, local] of FILES) {
  const out = path.join(DEST, local);
  if (fs.existsSync(out)) { console.log('уже есть:', local); continue; }
  process.stdout.write('качаю ' + local + '… ');
  const res = await fetch(BASE + remote);
  if (!res.ok) { console.log('ОШИБКА ' + res.status); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log((fs.statSync(out).size / 1048576).toFixed(1) + ' МБ');
}
console.log('Готово:', DEST);
