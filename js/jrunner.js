/**
 * jrunner.js — компиляция и запуск Java прямо в браузере.
 *
 * JVM даёт CheerpJ 4.2 (Leaning Technologies): их рантайм грузится с их же CDN,
 * бесплатен для некоммерческого использования. Компилятор — ecj (Eclipse
 * Compiler for Java, EPL), лежит у нас: java/ecj.jar. Сервер не компилирует
 * ничего, вся работа идёт в браузере студента.
 *
 * Грузится лениво: 40+ МБ рантайма тянутся только когда открыт урок Java.
 */
(function () {
  const LOADER = 'https://cjrtnc.leaningtech.com/4.2/loader.js';
  /* CheerpJ монтирует сайт в /app/, поэтому к пути от корня нужен этот префикс */
  const ECJ = '/app' + new URL('java/ecj.jar', location.href).pathname;
  const BUILD_MS = 120000;
  const RUN_MS = 15000;

  let booting = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('не удалось загрузить рантайм Java'));
      document.head.appendChild(s);
    });
  }

  function ensure(onStatus) {
    if (booting) return booting;
    booting = (async () => {
      if (onStatus) onStatus('load');
      await loadScript(LOADER);
      await cheerpjInit({ status: 'none' });
    })();
    return booting;
  }

  /* CheerpJ пишет System.out в console.log — другого канала наружу нет.
     Перехватываем только на время запуска и обязательно возвращаем как было. */
  async function capture(fn) {
    const out = [];
    const orig = console.log;
    console.log = (...a) => { out.push(a.join(' ')); };
    try { return { rc: await fn(), text: out.join('') }; }
    finally { console.log = orig; }
  }

  function withTimeout(promise, ms, message) {
    let timer;
    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(message)), ms); }),
    ]);
  }

  /** Имя главного класса. В файле может быть несколько классов (Unit, Archer, Main),
   *  запускать надо тот, что объявлен public — именно его требует ecj в имени файла. */
  function mainClass(code) {
    const pub = /\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_$][\w$]*)/.exec(code);
    if (pub) return pub[1];
    /* Публичного нет — берём тот, где есть main */
    const re = /\bclass\s+([A-Za-z_$][\w$]*)([\s\S]*?)(?=\bclass\s|$)/g;
    let m;
    while ((m = re.exec(code))) if (/static\s+void\s+main\s*\(/.test(m[2])) return m[1];
    const any = /\bclass\s+([A-Za-z_$][\w$]*)/.exec(code);
    return any ? any[1] : 'Main';
  }

  /* В уроке удобно показать три строки, а компилятору нужен класс с main:
     фрагмент без объявления класса оборачиваем сами. */
  function wrap(code) {
    if (/\bclass\s+[A-Za-z_$]/.test(code)) return code;
    return 'import java.util.*;\n\npublic class Main {\n' +
           '  public static void main(String[] args) throws Exception {\n' +
           code + '\n  }\n}\n';
  }

  async function run(code, _lang, _stdin, onStatus) {
    try {
      await ensure(onStatus);
    } catch (e) {
      return { out: '', err: e.message };
    }

    const src = wrap(code);
    const cls = mainClass(src);
    if (onStatus) onStatus('build');

    /* Каждый запуск — своя папка классов, иначе останется класс от прошлой попытки
       и «исправленный» код будет запускаться старым. */
    const dir = '/files/run' + Date.now() + '/';

    const compile = (source) => {
      cheerpjAddStringFile('/str/' + cls + '.java', source);
      return withTimeout(
        capture(() => cheerpjRunMain(
          'org.eclipse.jdt.internal.compiler.batch.Main', ECJ,
          '-1.8', '-nowarn', '-d', dir, '/str/' + cls + '.java')),
        BUILD_MS, 'Компиляция затянулась дольше обычного. Попробуй ещё раз.');
    };

    let build;
    try {
      build = await compile(src);

      /* Сам ecj под CheerpJ изредка падает внутренней ошибкой сканера на
         вполне корректном коде — воспроизводится на конкретном сочетании
         пустых строк. Это баг компилятора, а не студента, поэтому молча
         пробуем ещё раз без пустых строк: код тот же, ошибка уходит. */
      if (build.rc !== 0 && /ArrayIndexOutOfBounds|Internal compiler error/i.test(build.text)) {
        build = await compile(src.split('\n').filter(l => l.trim()).join('\n'));
      }
    } catch (e) {
      return { out: '', err: e.message };
    }

    if (build.rc !== 0) {
      /* Диагностика ecj информативнее кода возврата — её и показываем */
      return { out: '', err: build.text.trim() || 'Ошибка компиляции' };
    }

    if (onStatus) onStatus('run');
    let res;
    try {
      res = await withTimeout(
        capture(() => cheerpjRunMain(cls, dir)),
        RUN_MS, 'Превышено время выполнения. Проверь, нет ли бесконечного цикла (может понадобиться перезагрузить страницу).');
    } catch (e) {
      return { out: '', err: e.message };
    }

    /* Необработанное исключение JVM печатает в поток вывода и завершает код нулём:
       по коду возврата его не отличить, поэтому смотрим на текст. */
    const text = res.text;
    const exc = /^Exception in thread |^\s*java\.lang\./m.test(text);
    if (exc) {
      const lines = text.split('\n');
      const i = lines.findIndex(l => /Exception in thread |^java\./.test(l));
      return { out: lines.slice(0, i).join('\n'), err: lines.slice(i).join('\n').trim() };
    }
    return { out: text, err: null };
  }

  window.JavaRunner = {
    run,
    ensure: (onStatus) => ensure(onStatus),
    isReady: () => !!booting,
  };
})();
