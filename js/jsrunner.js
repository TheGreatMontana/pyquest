/* PyQuest — тренажёр JavaScript.
   Код выполняется в Web Worker: у него нет доступа к DOM, localStorage и странице,
   а зависший цикл убивается по таймауту вместе с воркером. */
(function () {
  const TIMEOUT_MS = 5000;

  /* Тело воркера. Собирается строкой и запускается через blob: —
     так не нужен отдельный файл и путь к нему. */
  const WORKER_SRC = `
    self.onmessage = function (e) {
      const { code, tests } = e.data;
      const out = [];
      const fmt = (v) => {
        if (typeof v === 'string') return v;
        if (v === undefined) return 'undefined';
        if (v === null) return 'null';
        try { return JSON.stringify(v); } catch (err) { return String(v); }
      };
      const console = {
        log: (...args) => out.push(args.map(fmt).join(' ')),
        error: (...args) => out.push(args.map(fmt).join(' ')),
        warn: (...args) => out.push(args.map(fmt).join(' ')),
        info: (...args) => out.push(args.map(fmt).join(' ')),
      };

      let err = null, testErr = null;
      let scope = null;
      try {
        // Возвращаем ссылки на объявленные функции, чтобы тесты их видели
        const fn = new Function('console', code + '\\n;return (typeof __exports !== "undefined") ? __exports : this;');
        scope = fn.call({}, console);
      } catch (e2) {
        err = (e2 && e2.stack ? String(e2.stack).split('\\n')[0] : String(e2));
      }

      if (!err && tests) {
        try {
          const assert = (cond, message) => {
            if (!cond) throw new Error(message || 'Проверка не пройдена');
          };
          const equal = (actual, expected, message) => {
            const a = JSON.stringify(actual), b = JSON.stringify(expected);
            if (a !== b) throw new Error((message || 'Ожидалось') + ': ' + b + ', а получено: ' + a);
          };
          const stdout = out.join('\\n');
          const testFn = new Function('assert', 'equal', 'stdout', 'console', code + '\\n' + tests);
          testFn(assert, equal, stdout, console);
        } catch (e3) {
          testErr = e3 && e3.message ? e3.message : String(e3);
        }
      }

      self.postMessage({ out: out.join('\\n'), err, test_err: testErr });
    };
  `;

  let blobUrl = null;
  function workerUrl() {
    if (!blobUrl) blobUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'application/javascript' }));
    return blobUrl;
  }

  /**
   * Выполняет код пользователя (и тесты, если переданы).
   * Возвращает { out, err, test_err } — тот же контракт, что у PyRunner.
   */
  function run(code, tests, _stdin, onStatus) {
    return new Promise((resolve) => {
      if (onStatus) onStatus('');
      let worker;
      try {
        worker = new Worker(workerUrl());
      } catch (e) {
        resolve({ out: '', err: 'Не удалось запустить песочницу: ' + e.message, test_err: null });
        return;
      }

      const timer = setTimeout(() => {
        worker.terminate();
        resolve({
          out: '',
          err: 'Выполнение прервано: код работал дольше ' + (TIMEOUT_MS / 1000) + ' секунд. Скорее всего цикл не завершается.',
          test_err: null,
        });
      }, TIMEOUT_MS);

      worker.onmessage = (e) => {
        clearTimeout(timer);
        worker.terminate();
        resolve(e.data);
      };
      worker.onerror = (e) => {
        clearTimeout(timer);
        worker.terminate();
        resolve({ out: '', err: e.message || 'Ошибка выполнения', test_err: null });
      };

      worker.postMessage({ code, tests: tests || '' });
    });
  }

  async function ensure() { return true; }   // ничего грузить не нужно — движок уже в браузере

  window.JsRunner = { run, ensure, isReady: () => true };
})();
