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

/**
 * Ищет позицию закрывающей скобки массива modules.
 * Регулярка тут не годится: внутри модулей полно вложенных массивов, и любой
 * шаблон цепляется за первый попавшийся. Считаем скобки вручную, пропуская
 * то, что лежит внутри строк.
 */
function findModulesArrayEnd(text) {
  const key = text.indexOf('"modules"');
  if (key < 0) return -1;
  const open = text.indexOf('[', key);
  if (open < 0) return -1;

  let depth = 0, inString = false, escaped = false;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return i;      // это и есть закрытие modules
    }
  }
  return -1;
}

const closeAt = findModulesArrayEnd(src);
if (closeAt < 0) {
  console.error('не нашёл конец массива modules в ' + target + ' — вставка отменена');
  process.exit(1);
}

const eol = src.includes('\r\n') ? '\r\n' : '\n';
const indented = mod.split('\n').map(l => (l ? '  ' + l : l)).join(eol);

/* Всё до закрывающей скобки массива — это последний модуль и перевод строки
   перед ней. Ставим запятую после него и вписываем новый модуль. Склейка
   строками, а не replace: в строке замены $$ значит один доллар, и хелпер $$
   из тестов по вёрстке молча превратился бы в $. */
const before = src.slice(0, closeAt).replace(/\s*$/, '');
const after = src.slice(closeAt);
const out = before + ',' + eol + indented + eol + ' ' + after;

const check = JSON.parse(out);
if (check.modules.length !== courseObj.modules.length + 1) {
  console.error('после вставки модулей стало не столько, сколько ожидалось');
  process.exit(1);
}

fs.writeFileSync(target, out);
console.log(course + ': добавлен модуль ' + modObj.id + ', всего модулей ' + check.modules.length);
