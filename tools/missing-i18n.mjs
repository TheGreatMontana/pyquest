/**
 * missing-i18n.mjs — что именно не переведено в курсе.
 *
 * Валидатор говорит «57%», но не говорит, какие поля. Этот скрипт выписывает
 * непереведённые пути в том же виде, в каком их ждёт оверлей, — остаётся
 * заполнить значения.
 *
 *   node tools/missing-i18n.mjs python-basics uz
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COURSES = path.join(HERE, '..', 'content', 'courses');

const courseId = process.argv[2];
const lang = process.argv[3] || 'uz';
if (!courseId) { console.log('нужен id курса, например: node tools/missing-i18n.mjs python-basics uz'); process.exit(2); }

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const course = read(path.join(COURSES, courseId + '.json'));
const overlayPath = path.join(COURSES, courseId + '.' + lang + '.json');
const overlay = fs.existsSync(overlayPath) ? read(overlayPath) : {};

const missing = [];
const isMl = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('ru' in v || 'en' in v);

function walk(node, keyPath) {
  if (isMl(node)) {
    if (!node[lang] && !(keyPath in overlay)) missing.push([keyPath, node.ru || node.en || '']);
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

/* Пути строятся от id модуля — так же, как их читает оверлей */
for (const m of course.modules) {
  const rest = Object.assign({}, m);
  delete rest.id;
  walk(rest, m.id);
}
/* Финальный экзамен лежит рядом с модулями и переводится теми же оверлеями */
if (course.finalExam) walk(course.finalExam, 'finalExam');

console.log('# ' + courseId + ' → ' + lang + ': не переведено ' + missing.length + ' полей');
if (process.argv.includes('--json')) {
  const out = {};
  missing.forEach(([k, v]) => { out[k] = v; });
  console.log(JSON.stringify(out, null, 1));
} else {
  missing.slice(0, Number(process.argv[4]) || 25).forEach(([k, v]) =>
    console.log(k + '\n    ' + String(v).replace(/\s+/g, ' ').slice(0, 100)));
}
