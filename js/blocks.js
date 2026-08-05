/**
 * blocks.js — рендер и логика блоков урока.
 *
 * Урок собирается из блоков разных типов, поэтому уроки не выглядят одинаково:
 * теория чередуется с запускаемыми примерами и интерактивом (предскажи вывод,
 * найди баг, сопоставь пары, расставь по порядку, проверка знаний).
 *
 * Интерактивные блоки дают XP один раз — повтор ничего не начисляет.
 */
import { tr, t, isFallback } from './core/i18n.js';
import { esc, ic, codeBlock, toast, shuffle, announce } from './ui.js';
import { awardBlock } from './core/gamification.js';

let ctx = { courseId: null, moduleId: null, lessonId: null };
export function setBlockContext(courseId, moduleId, lessonId) {
  ctx = { courseId, moduleId, lessonId };
}
const blockKey = (i) => ctx.lessonId + ':' + i;

/* ---------- рендер ---------- */

export function renderBlock(b, i) {
  switch (b.type) {
    case 'text': return '<div class="b-text">' + tr(b.html) + '</div>';

    case 'code': return codeBlock(b.code, b.lang);

    case 'run':
    case 'jsrun':
    case 'crun':
    case 'cpprun':
    case 'csharprun':
    case 'javarun':
    case 'sqlrun': {
      const KIND = { sqlrun: 'sql', jsrun: 'js', crun: 'c', cpprun: 'cpp', javarun: 'java', csharprun: 'cs', run: 'py' };
      const LANG = { sql: 'sql', js: 'javascript', c: 'c', cpp: 'cpp', java: 'java', cs: 'csharp', py: 'python' };
      const kind = KIND[b.type];
      const lang = b.lang || LANG[kind];
      return codeBlock(b.code, lang) +
        '<div class="try-box" data-block="' + i + '">' +
        '<button class="btn small blue" data-run="' + kind + '" data-i="' + i + '">' +
        ic('play') + ' ' + esc(t(kind === 'sql' ? 'lesson.runSql' : 'lesson.run')) + '</button>' +
        '<div class="try-out" hidden></div></div>';
    }

    case 'webrun': {
      /* Пример вёрстки: код и сразу под ним — как это выглядит */
      return codeBlock(b.code, b.lang || 'html') +
        '<div class="web-pane"><div class="web-pane-head">' + ic('eye') + ' ' + esc(t('lesson.preview')) + '</div>' +
        '<div class="web-frame" data-web="' + i + '"></div></div>';
    }

    case 'note': {
      const kind = b.kind || 'note';
      const label = t(kind === 'tip' ? 'block.tip' : kind === 'trap' ? 'block.trap' : 'block.note');
      return '<aside class="b-note ' + esc(kind) + '"><b>' + ic(kind === 'trap' ? 'alert' : 'info') + ' ' +
        esc(label) + '</b><div>' + tr(b.html) + '</div></aside>';
    }

    case 'predict':
      return '<div class="b-inter b-predict" data-block="' + i + '">' +
        '<h4>' + ic('target') + ' ' + esc(t('block.predict')) + '</h4>' +
        codeBlock(b.code, b.lang) +
        '<div class="b-options">' + b.options.map((o, oi) =>
          '<button class="b-opt" data-i="' + i + '" data-o="' + oi + '">' + esc(tr(o)) + '</button>').join('') +
        '</div><div class="b-feedback" hidden></div></div>';

    case 'findbug':
      return '<div class="b-inter b-findbug" data-block="' + i + '">' +
        '<h4>' + ic('alert') + ' ' + esc(t('block.findbug')) + '</h4>' +
        '<p class="b-hint">' + esc(t('block.findbugHint')) + '</p>' +
        '<div class="b-lines">' + b.lines.map((line, li) =>
          '<button class="b-line" data-i="' + i + '" data-o="' + li + '">' +
          '<span class="ln">' + (li + 1) + '</span><code>' + esc(line) + '</code></button>').join('') +
        '</div><div class="b-feedback" hidden></div></div>';

    case 'match': {
      const rights = shuffle(b.pairs.map((p, pi) => ({ text: tr(p.right), idx: pi })));
      return '<div class="b-inter b-match" data-block="' + i + '">' +
        '<h4>' + ic('layers') + ' ' + esc(t('block.match')) + '</h4>' +
        '<p class="b-hint">' + esc(t('block.matchHint')) + '</p>' +
        '<div class="match-grid"><div class="match-col">' +
        b.pairs.map((p, pi) => '<button class="match-item left" data-i="' + i + '" data-idx="' + pi + '">' +
          esc(tr(p.left)) + '</button>').join('') +
        '</div><div class="match-col">' +
        rights.map(r => '<button class="match-item right" data-i="' + i + '" data-idx="' + r.idx + '">' +
          esc(r.text) + '</button>').join('') +
        '</div></div><div class="b-feedback" hidden></div></div>';
    }

    case 'order': {
      const shuffled = shuffle(b.steps.map((s, si) => ({ text: tr(s), idx: si })));
      return '<div class="b-inter b-order" data-block="' + i + '">' +
        '<h4>' + ic('algo') + ' ' + esc(t('block.order')) + '</h4>' +
        '<p class="b-hint">' + esc(t('block.orderHint')) + '</p>' +
        '<ol class="order-slots"></ol>' +
        '<div class="order-pool">' + shuffled.map(s =>
          '<button class="order-item" data-i="' + i + '" data-idx="' + s.idx + '">' + esc(s.text) + '</button>').join('') +
        '</div><button class="btn secondary small order-reset" data-i="' + i + '">' + esc(t('block.orderReset')) + '</button>' +
        '<div class="b-feedback" hidden></div></div>';
    }

    case 'checkpoint':
      return '<div class="b-inter b-checkpoint" data-block="' + i + '">' +
        '<h4>' + ic('shield') + ' ' + esc(t('block.checkpoint')) + '</h4>' +
        '<p class="b-question">' + tr(b.q) + '</p>' +
        (b.code ? codeBlock(b.code, b.lang) : '') +
        '<div class="b-options">' + b.options.map((o, oi) =>
          '<button class="b-opt" data-i="' + i + '" data-o="' + oi + '">' + esc(tr(o)) + '</button>').join('') +
        '</div><div class="b-feedback" hidden></div></div>';

    case 'summary':
      return '<div class="b-summary"><h4>' + ic('check') + ' ' + esc(t('block.summary')) + '</h4><ul>' +
        b.items.map(x => '<li>' + tr(x) + '</li>').join('') + '</ul></div>';

    default:
      return '';
  }
}

export function renderBlocks(blocks) {
  return blocks.map((b, i) => renderBlock(b, i)).join('');
}

/* ---------- поведение ---------- */

function feedback(root, ok, html) {
  const fb = root.querySelector('.b-feedback');
  fb.hidden = false;
  fb.className = 'b-feedback ' + (ok ? 'ok' : 'bad');
  fb.innerHTML = (ok ? ic('check') + ' <b>' + esc(t('block.correct')) + '</b> ' : ic('alert') + ' <b>' + esc(t('block.wrong')) + '</b> ') + (html || '');
  announce(ok ? t('block.correct') : t('block.wrong'));
}

function reward(i) {
  if (!ctx.courseId) return;
  const gained = awardBlock(ctx.courseId, ctx.moduleId, blockKey(i));
  if (gained) toast('+' + gained + ' ' + t('common.xp'));
}

/**
 * Навешивает обработчики на интерактивные блоки внутри контейнера.
 * runners: { py(code), sql(code) } — для блоков с запуском.
 */
export function bindBlocks(container, blocks, runners) {
  /* Предпросмотр вёрстки рисуем сразу: ждать нажатия незачем, это не вычисление */
  container.querySelectorAll('[data-web]').forEach(box => {
    const b = blocks[+box.getAttribute('data-web')];
    if (window.WebRunner) window.WebRunner.render(box, b.kind || 'html', b.code, b, null, null);
  });

  /* Запускаемые примеры */
  container.querySelectorAll('[data-run]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = +btn.getAttribute('data-i');
      const b = blocks[i];
      const out = btn.parentElement.querySelector('.try-out');
      out.hidden = false;
      out.textContent = t('lesson.running');
      const kind = btn.getAttribute('data-run');
      try {
        if (kind === 'sql') {
          const res = await runners.sql(b.code, s => { out.textContent = s || '…'; });
          out.innerHTML = res.error ? '<span class="err">' + esc(res.error) + '</span>' : res.html;
        } else {
          const res = await runners[kind](b.code, s => { out.textContent = s || '…'; });
          out.textContent = res.err ? res.err : (res.out || t('lesson.noOutput'));
        }
      } catch (e) { out.textContent = '⚠ ' + e.message; }
    });
  });

  /* Предскажи вывод / проверка знаний — выбор одного варианта */
  container.querySelectorAll('.b-predict, .b-checkpoint').forEach(root => {
    const i = +root.getAttribute('data-block');
    const b = blocks[i];
    root.querySelectorAll('.b-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = +btn.getAttribute('data-o');
        const ok = chosen === b.a;
        root.querySelectorAll('.b-opt').forEach((el, oi) => {
          el.disabled = true;
          if (oi === b.a) el.classList.add('correct');
          else if (oi === chosen) el.classList.add('wrong');
        });
        let extra = b.explain ? tr(b.explain) : '';
        if (b.type === 'predict' && runners && runners.py) {
          extra += '<div class="predict-run"><button class="btn small blue" data-predict-run="' + i + '">' +
            ic('play') + ' ' + esc(t('block.predictReal')) + '</button><div class="try-out" hidden></div></div>';
        }
        feedback(root, ok, extra);
        if (ok) reward(i);
        const pr = root.querySelector('[data-predict-run]');
        if (pr) pr.addEventListener('click', async () => {
          const out = pr.parentElement.querySelector('.try-out');
          out.hidden = false;
          out.textContent = t('lesson.running');
          const res = await runners.py(b.code, s => { out.textContent = s || '…'; });
          out.textContent = res.err ? res.err : (res.out || t('lesson.noOutput'));
        });
      });
    });
  });

  /* Найди баг */
  container.querySelectorAll('.b-findbug').forEach(root => {
    const i = +root.getAttribute('data-block');
    const b = blocks[i];
    root.querySelectorAll('.b-line').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = +btn.getAttribute('data-o');
        const ok = chosen === b.bugLine;
        root.querySelectorAll('.b-line').forEach((el, li) => {
          el.disabled = true;
          if (li === b.bugLine) el.classList.add('correct');
          else if (li === chosen) el.classList.add('wrong');
        });
        feedback(root, ok, b.explain ? tr(b.explain) : '');
        if (ok) reward(i);
      });
    });
  });

  /* Сопоставь пары */
  container.querySelectorAll('.b-match').forEach(root => {
    const i = +root.getAttribute('data-block');
    const b = blocks[i];
    let selected = null, matched = 0;
    root.querySelectorAll('.match-item').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('done')) return;
        const isLeft = btn.classList.contains('left');
        if (!selected) {
          root.querySelectorAll('.match-item').forEach(x => x.classList.remove('sel'));
          btn.classList.add('sel');
          selected = btn;
          return;
        }
        if (selected === btn) { btn.classList.remove('sel'); selected = null; return; }
        const selLeft = selected.classList.contains('left');
        if (selLeft === isLeft) {                       // выбрали два из одной колонки
          root.querySelectorAll('.match-item').forEach(x => x.classList.remove('sel'));
          btn.classList.add('sel');
          selected = btn;
          return;
        }
        const ok = selected.getAttribute('data-idx') === btn.getAttribute('data-idx');
        if (ok) {
          [selected, btn].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); x.disabled = true; });
          matched++;
          if (matched === b.pairs.length) { feedback(root, true, ''); reward(i); }
        } else {
          btn.classList.add('shake');
          setTimeout(() => btn.classList.remove('shake'), 400);
          selected.classList.remove('sel');
        }
        selected = null;
      });
    });
  });

  /* Расставь по порядку */
  container.querySelectorAll('.b-order').forEach(root => {
    const i = +root.getAttribute('data-block');
    const b = blocks[i];
    const slots = root.querySelector('.order-slots');
    const pool = root.querySelector('.order-pool');
    let placed = [];

    function check() {
      if (placed.length !== b.steps.length) return;
      const ok = placed.every((idx, pos) => idx === pos);
      feedback(root, ok, ok ? '' : esc(t('block.orderHint')));
      if (ok) { reward(i); slots.querySelectorAll('li').forEach(li => li.classList.add('ok')); }
    }
    pool.querySelectorAll('.order-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.getAttribute('data-idx');
        btn.disabled = true;
        btn.classList.add('used');
        placed.push(idx);
        const li = document.createElement('li');
        li.textContent = btn.textContent;
        slots.appendChild(li);
        check();
      });
    });
    root.querySelector('.order-reset').addEventListener('click', () => {
      placed = [];
      slots.innerHTML = '';
      pool.querySelectorAll('.order-item').forEach(x => { x.disabled = false; x.classList.remove('used'); });
      const fb = root.querySelector('.b-feedback');
      fb.hidden = true;
    });
  });
}

/** Есть ли в уроке блоки, требующие раннера — чтобы прогреть его заранее. */
export function needsRunner(blocks) {
  return {
    py: blocks.some(b => b.type === 'run' || (b.type === 'predict' && (!b.lang || b.lang === 'python'))),
    js: blocks.some(b => b.type === 'jsrun' || (b.type === 'predict' && b.lang === 'javascript')),
    c: blocks.some(b => b.type === 'crun'),
    cpp: blocks.some(b => b.type === 'cpprun'),
    java: blocks.some(b => b.type === 'javarun'),
    sql: blocks.some(b => b.type === 'sqlrun'),
    web: blocks.some(b => b.type === 'webrun'),
  };
}
