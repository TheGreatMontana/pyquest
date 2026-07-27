/* PyQuest — запуск Python в браузере через Pyodide (WebAssembly CPython) */
(function () {
  let pyodide = null;
  let loading = null;

  const HARNESS = `
import io, sys, traceback, json

def _pq_make_input(lines):
    it = iter(list(lines))
    def _input(prompt=''):
        try:
            v = str(next(it))
        except StopIteration:
            raise RuntimeError('input(): программа запросила больше данных, чем задано в условии')
        print(str(prompt) + v)
        return v
    return _input

def _pq_clean_tb(tb):
    lines = [l for l in tb.splitlines() if '_pq_run' not in l and 'exec(compile' not in l]
    return '\\n'.join(lines)

def _pq_run(code, tests, stdin_lines):
    ns = {'__name__': '__main__'}
    if stdin_lines:
        ns['input'] = _pq_make_input(stdin_lines)
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    err = None
    try:
        exec(compile(code, 'main.py', 'exec'), ns)
    except BaseException:
        err = _pq_clean_tb(traceback.format_exc())
    finally:
        sys.stdout = old
    out = buf.getvalue()
    test_err = None
    if err is None and tests:
        ns['_stdout'] = out
        buf2 = io.StringIO()
        sys.stdout = buf2
        try:
            exec(compile(tests, 'tests.py', 'exec'), ns)
        except AssertionError as e:
            test_err = str(e) or 'Проверка не пройдена'
        except BaseException:
            test_err = _pq_clean_tb(traceback.format_exc())
        finally:
            sys.stdout = old
    return json.dumps({'out': out, 'err': err, 'test_err': test_err})
`;

  async function ensure(onStatus) {
    if (pyodide) return pyodide;
    if (!loading) {
      loading = (async () => {
        if (onStatus) onStatus('Загружаю Python (~10 МБ, один раз)…');
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          s.onload = res;
          s.onerror = () => rej(new Error('Не удалось загрузить Pyodide. Проверь интернет.'));
          document.head.appendChild(s);
        });
        const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
        py.runPython(HARNESS);
        pyodide = py;
        return py;
      })();
    }
    return loading;
  }

  /**
   * Запускает код пользователя, опционально с тестами и подставным stdin.
   * Возвращает {out, err, test_err}.
   */
  async function run(code, tests, stdinLines, onStatus) {
    const py = await ensure(onStatus);
    if (onStatus) onStatus('');
    const fn = py.globals.get('_pq_run');
    try {
      const res = fn(code, tests || '', stdinLines || []);
      return JSON.parse(res);
    } finally {
      fn.destroy();
    }
  }

  window.PyRunner = { run, ensure, isReady: () => !!pyodide };
})();
