/**
 * append-module.mjs — дописать модуль в курс, не переформатируя остальной файл.
 *
 * Курсы вручную сверстаны так, что многоязычные объекты стоят в одну строку.
 * Полный JSON.parse + stringify это разрушил бы и дал бы нечитаемый diff,
 * поэтому вставка текстовая: находим последнюю скобку массива modules и
 * подставляем новый модуль перед ней.
 *
 *   node tools/append-module.mjs <курс> <файл-модуля.json>
 */
import fs from 'fs';
import path from 'path';

const [course, modFile] = process.argv.slice(2);
if (!course || !modFile) {
  console.error('нужно: node tools/append-module.mjs <курс> <файл-модуля.json>');
  process.exit(1);
}

const target = path.join('content', 'courses', course + '.json');
const src = fs.readFileSync(target, 'utf8');
const mod = fs.readFileSync(modFile, 'utf8').trim();

/* Проверяем обе стороны до записи: битый модуль не должен попасть в курс */
const modObj = JSON.parse(mod);
const courseObj = JSON.parse(src);
if (courseObj.modules.some(m => m.id === modObj.id)) {
  console.error('модуль ' + modObj.id + ' уже есть в курсе ' + course);
  process.exit(1);
}

/* Хвост файла: закрытие последнего модуля, массива modules и объекта курса.
   Часть курсов лежит с CRLF, часть с LF — переводы строк в шаблоне гибкие,
   а результат пишется тем же стилем, что был в файле. */
const tail = /\r?\n\s*\}\r?\n\s*\]\r?\n\}\s*$/;
if (!tail.test(src)) {
  console.error('неожиданный конец файла ' + target + ' — вставка отменена');
  process.exit(1);
}

const eol = src.includes('\r\n') ? '\r\n' : '\n';
const indented = mod.split('\n').map(l => (l ? '  ' + l : l)).join(eol);
const out = src.replace(tail, eol + '  },' + eol + indented + eol + ' ]' + eol + '}' + eol);

const check = JSON.parse(out);
if (check.modules.length !== courseObj.modules.length + 1) {
  console.error('после вставки модулей стало не столько, сколько ожидалось');
  process.exit(1);
}

fs.writeFileSync(target, out);
console.log(course + ': добавлен модуль ' + modObj.id + ', всего модулей ' + check.modules.length);
