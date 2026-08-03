# -*- coding: utf-8 -*-
"""Проверка Python-фрагментов: компиляция всех, исполнение запускаемых примеров."""
import io, json, sys, contextlib, os, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, '.out', 'py-snippets.json'), encoding='utf-8') as f:
    snippets = json.load(f)

os.chdir(tempfile.mkdtemp())        # файловые примеры пишут во временную папку
fails = []
executed = 0

for s in snippets:
    code = s['code']
    try:
        compiled = compile(code, s['name'], 'exec')
    except SyntaxError as e:
        fails.append((s['name'], 'СИНТАКСИС: %s (строка %s)' % (e.msg, e.lineno)))
        continue
    if s.get('exec'):
        ns = {'__name__': '__main__'}
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                exec(compiled, ns)
            executed += 1
        except Exception as e:
            fails.append((s['name'], 'ВЫПОЛНЕНИЕ: %r' % (e,)))

if fails:
    print('ОШИБКИ (%d из %d):' % (len(fails), len(snippets)))
    for name, msg in fails:
        print(' -', name, '->', msg)
    sys.exit(1)
print('Python: %d фрагментов скомпилировано, %d выполнено ✔' % (len(snippets), executed))
