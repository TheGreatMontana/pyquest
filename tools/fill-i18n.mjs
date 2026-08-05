/**
 * fill-i18n.mjs — дописать переводы в оверлей курса.
 *
 * Два режима:
 *
 *   node tools/fill-i18n.mjs <курс> <язык> --neutral
 *       Заполняет поля, в которых нет ни одной кириллической буквы:
 *       `print()`, `SELECT`, `O(n log n)`, `42`. Переводить там нечего,
 *       и держать их непереведёнными — врать самому себе о проценте.
 *
 *   node tools/fill-i18n.mjs <курс> <язык> --from <файл.json>
 *       Дописывает пары «путь → перевод» из файла. Уже существующие
 *       ключи не трогает: ручной перевод всегда важнее автоматического.
 *
 * Оверлей пишется отсортированным — так diff показывает только новое.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COURSES = path.join(HERE, '..', 'content', 'courses');

const [courseId, lang] = process.argv.slice(2);
const neutralMode = process.argv.includes('--neutral');
const fromIndex = process.argv.indexOf('--from');
const fromFile = fromIndex > 0 ? process.argv[fromIndex + 1] : null;

if (!courseId || !lang || (!neutralMode && !fromFile)) {
  console.error('нужно: node tools/fill-i18n.mjs <курс> <язык> (--neutral | --from файл.json)');
  process.exit(2);
}

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const course = read(path.join(COURSES, courseId + '.json'));
const overlayPath = path.join(COURSES, courseId + '.' + lang + '.json');
const overlay = fs.existsSync(overlayPath) ? read(overlayPath) : {};

/* Собираем непереведённые поля тем же обходом, что и missing-i18n.mjs */
const CYRILLIC = /[Ѐ-ӿ]/;
const isMl = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('ru' in v || 'en' in v);
const missing = new Map();

function walk(node, keyPath) {
  if (isMl(node)) {
    if (!node[lang] && !(keyPath in overlay)) missing.set(keyPath, node.ru || node.en || '');
    return;
  }
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, keyPath + '.' + i)); return; }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (k === 'id' || k === 'code' || k === 'tests' || k === 'starter' || k === 'solution') continue;
      walk(node[k], keyPath ? keyPath + '.' + k : k);
    }
  }
}
for (const m of course.modules) {
  const rest = Object.assign({}, m);
  delete rest.id;
  walk(rest, m.id);
}

let added = 0;
const skipped = [];

if (neutralMode) {
  for (const [key, value] of missing) {
    if (CYRILLIC.test(value)) continue;
    overlay[key] = value;
    added++;
  }
} else {
  const incoming = read(fromFile);
  for (const [key, value] of Object.entries(incoming)) {
    if (key in overlay) { skipped.push(key); continue; }
    if (!missing.has(key)) { skipped.push(key); continue; }
    overlay[key] = value;
    added++;
  }
}

if (!added) { console.log(courseId + ' → ' + lang + ': добавлять нечего'); process.exit(0); }

const sorted = {};
for (const key of Object.keys(overlay).sort()) sorted[key] = overlay[key];
fs.writeFileSync(overlayPath, JSON.stringify(sorted, null, 1) + '\n', 'utf8');

console.log(courseId + ' → ' + lang + ': добавлено ' + added + ', всего в оверлее ' + Object.keys(sorted).length +
  (skipped.length ? ', пропущено (уже есть или лишние) ' + skipped.length : ''));
