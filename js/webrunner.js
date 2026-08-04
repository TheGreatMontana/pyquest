/**
 * webrunner.js — живой предпросмотр HTML, CSS и Tailwind.
 *
 * Вёрстку бессмысленно «запускать» в консоль: её надо видеть. Код студента
 * рендерится в iframe с атрибутом sandbox без allow-same-origin — страница
 * получает отдельное, чужое для нас происхождение и до основного документа,
 * localStorage и прогресса дотянуться не может.
 *
 * Проверки выполняются внутри того же iframe и присылают результат через
 * postMessage: снаружи в такой документ не заглянуть, и это правильно.
 */
(function () {
  const TAILWIND_CDN = 'https://cdn.tailwindcss.com';
  const RUN_MS = 8000;

  /** Собирает готовый документ под язык задачи. */
  function buildDoc(kind, code, extra) {
    const html = (extra && extra.html) || '';
    const css = (extra && extra.css) || '';
    const head = [
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      kind === 'tailwind' ? '<script src="' + TAILWIND_CDN + '"></script>' : '',
      /* Немного базовой типографики, чтобы предпросмотр не выглядел как голый
         документ 1995 года — но только там, где студент не учит CSS сам. */
      kind === 'html'
        ? '<style>body{font:16px/1.6 system-ui,sans-serif;color:#0f172a;background:#fff;padding:16px;margin:0}' +
          'img{max-width:100%}table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:6px 10px}</style>'
        : '<style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#fff;color:#0f172a}</style>',
      css ? '<style>' + css + '</style>' : '',
    ].join('');

    if (kind === 'css') {
      /* Студент пишет стили, разметка дана в задаче */
      return '<!DOCTYPE html><html><head>' + head + '<style>' + code + '</style></head><body>' + html + '</body></html>';
    }
    /* html и tailwind: студент пишет разметку целиком */
    const body = /<body[\s>]/i.test(code) || /<!DOCTYPE/i.test(code) ? null : code;
    if (body === null) return code;   // студент прислал полный документ — уважаем
    return '<!DOCTYPE html><html><head>' + head + '</head><body>' + body + '</body></html>';
  }

  /* Скрипт проверок живёт внутри iframe: снаружи в sandbox-документ не заглянуть */
  function testScript(tests) {
    return '<script>(function(){\n' +
      'function send(m){ parent.postMessage(Object.assign({__pq:1}, m), "*"); }\n' +
      'function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn); }\n' +
      'ready(function(){\n' +
      /* Tailwind из CDN дорисовывает стили после загрузки — даём ему кадр */
      '  setTimeout(function(){\n' +
      '    var $ = function(s){ return document.querySelector(s); };\n' +
      '    var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };\n' +
      '    var style = function(el, prop){ if(typeof el==="string") el=$(el); return el? getComputedStyle(el).getPropertyValue(prop).trim() : ""; };\n' +
      '    var text = function(el){ if(typeof el==="string") el=$(el); return el? el.textContent.trim() : ""; };\n' +
      '    var assert = function(cond, msg){ if(!cond) throw new Error(msg || "Проверка не пройдена"); };\n' +
      '    var equal = function(a, b, msg){ if(String(a)!==String(b)) throw new Error((msg||"Ожидалось")+": "+b+", а получилось: "+a); };\n' +
      '    try {\n' +
      tests + '\n' +
      '      send({ ok: true });\n' +
      '    } catch(e) { send({ ok: false, err: e && e.message ? e.message : String(e) }); }\n' +
      '  }, 250);\n' +
      '});\n' +
      '})();<\/script>';
  }

  /**
   * Показывает результат в контейнере.
   * @returns {HTMLIFrameElement}
   */
  function render(container, kind, code, extra, tests, onResult) {
    container.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.className = 'web-preview';
    /* allow-scripts без allow-same-origin: скрипты работают, доступа к нам нет */
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', 'Результат');
    container.appendChild(frame);

    let doc = buildDoc(kind, code, extra);
    if (tests) {
      /* Замена только функцией: в строке замены $$ значит литеральный доллар,
         и helper $$ превратился бы в $, перезаписав селектор одного элемента. */
      const inject = () => testScript(tests) + '</body>';
      doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, inject) : doc + testScript(tests);
    }

    if (tests && onResult) {
      let done = false;
      const finish = (res) => { if (done) return; done = true; window.removeEventListener('message', onMsg); clearTimeout(timer); onResult(res); };
      const onMsg = (e) => {
        if (e.source !== frame.contentWindow || !e.data || !e.data.__pq) return;
        finish({ ok: !!e.data.ok, err: e.data.err || null });
      };
      window.addEventListener('message', onMsg);
      const timer = setTimeout(() => finish({ ok: false, err: 'Страница не ответила вовремя. Проверь, нет ли ошибки в разметке.' }), RUN_MS);
    }

    frame.srcdoc = doc;
    return frame;
  }

  window.WebRunner = { render, buildDoc, isReady: () => true, ensure: () => Promise.resolve() };
})();
