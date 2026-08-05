/**
 * csrunner.js — компиляция и запуск C# прямо в браузере.
 *
 * Внутри настоящий Roslyn, собранный под WebAssembly (Blazor). Он живёт в
 * отдельном приложении по адресу /dotnet/ и подключается скрытым iframe:
 * общий с ним только обмен сообщениями, доступа к нашей странице у него нет.
 *
 * Рантайм (~12 МБ в сжатом виде) грузится один раз и только когда открыт урок
 * C# — на остальных страницах он не появляется вовсе.
 */
(function () {
  const FRAME_SRC = 'dotnet/index.html';
  const BOOT_MS = 180000;   // первая загрузка рантайма
  const RUN_MS = 60000;     // компиляция и выполнение

  let frame = null;
  let ready = false;
  let bootWaiters = [];
  let seq = 0;
  const pending = new Map();

  function onMessage(e) {
    const d = e.data;
    if (!d || !frame || e.source !== frame.contentWindow) return;

    if (d.__cs === 'ready') {
      ready = true;
      bootWaiters.splice(0).forEach(fn => fn());
      return;
    }
    if (d.__cs === 1 && pending.has(d.id)) {
      const done = pending.get(d.id);
      pending.delete(d.id);
      done({ out: d.out || '', err: d.err || null });
    }
  }

  function ensure(onStatus) {
    if (ready) return Promise.resolve();
    if (!frame) {
      if (onStatus) onStatus('load');
      window.addEventListener('message', onMessage);
      frame = document.createElement('iframe');
      frame.src = FRAME_SRC;
      frame.title = 'C# runtime';
      /* Виден быть не должен, но display:none мешает некоторым браузерам
         выполнять внутри скрипты — поэтому уводим за пределы экрана. */
      frame.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;top:0;border:0';
      document.body.appendChild(frame);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Рантайм C# не загрузился. Проверь соединение и обнови страницу.')), BOOT_MS);
      bootWaiters.push(() => { clearTimeout(timer); resolve(); });
    });
  }

  async function run(code, _lang, _stdin, onStatus) {
    try {
      await ensure(onStatus);
    } catch (e) {
      return { out: '', err: e.message };
    }

    if (onStatus) onStatus('build');
    const id = ++seq;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve({ out: '', err: 'Превышено время выполнения. Проверь, нет ли бесконечного цикла.' });
      }, RUN_MS);

      pending.set(id, (res) => { clearTimeout(timer); resolve(res); });
      frame.contentWindow.postMessage({ __cs: 'run', id, code }, '*');
    });
  }

  window.CsRunner = { run, ensure, isReady: () => ready };
})();
