/**
 * sync-catalog.mjs — подтянуть moduleCount и часы в каталоге к реальным курсам.
 *
 * Курс и каталог правятся в разных файлах, и разъезд между ними validate.js
 * ловит как ошибку. Здесь считаем модули прямо в файлах курсов и правим
 * каталог текстовой заменой — форматирование остального файла не трогаем.
 *
 * За каждый добавленный модуль часы растут на HOURS_PER_MODULE: модуль — это
 * три урока, задачи и экзамен, примерно столько он и занимает.
 *
 *   node tools/sync-catalog.mjs          показать расхождения
 *   node tools/sync-catalog.mjs --write  записать
 */
import fs from 'fs';

const HOURS_PER_MODULE = 6;
const write = process.argv.includes('--write');

const path = 'content/catalog.json';
let text = fs.readFileSync(path, 'utf8');
const catalog = JSON.parse(text);
let changes = 0;

for (const course of catalog.courses) {
  const file = 'content/courses/' + course.id + '.json';
  if (!fs.existsSync(file)) continue;
  const real = JSON.parse(fs.readFileSync(file, 'utf8')).modules.length;
  if (real === course.moduleCount) continue;

  const hours = course.estimatedHours + HOURS_PER_MODULE * (real - course.moduleCount);
  console.log(course.id.padEnd(20) +
    'модулей ' + course.moduleCount + ' -> ' + real +
    ', часов ' + course.estimatedHours + ' -> ' + hours);
  changes++;
  if (!write) continue;

  /* Правим только внутри блока этого курса: ищем от его "id" до конца объекта */
  const start = text.indexOf('"id": "' + course.id + '"');
  if (start < 0) { console.error('не нашёл ' + course.id + ' в каталоге'); process.exit(1); }
  const end = text.indexOf('"runner"', start);
  const head = text.slice(0, start);
  let body = text.slice(start, end);
  const tail = text.slice(end);

  body = body.replace(/"moduleCount": \d+/, '"moduleCount": ' + real)
             .replace(/"estimatedHours": \d+/, '"estimatedHours": ' + hours);
  text = head + body + tail;
}

if (!changes) { console.log('каталог и курсы совпадают'); process.exit(0); }
if (!write) { console.log('\nничего не записано, добавь --write'); process.exit(0); }

const after = JSON.parse(text);
if (after.courses.length !== catalog.courses.length) {
  console.error('после правки курсов стало другое количество — запись отменена');
  process.exit(1);
}
fs.writeFileSync(path, text);
console.log('\nкаталог обновлён: ' + changes + ' курс(ов)');
