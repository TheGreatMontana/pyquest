# -*- coding: utf-8 -*-
"""
Прогон эталонных решений через автотесты задач — тем же способом, что и в браузере.
Гарантирует: каждая задача решаема, тесты не ложно-положительные.
"""
import io, json, os, sys, tempfile, contextlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from solutions import SOLUTIONS

CONTENT = os.path.join(HERE, '..', 'content')


def make_input(lines):
    it = iter(list(lines))
    def _input(prompt=''):
        v = str(next(it))
        print(str(prompt) + v)
        return v
    return _input


def run_task(code, tests, stdin_lines):
    ns = {'__name__': '__main__'}
    if stdin_lines:
        ns['input'] = make_input(stdin_lines)
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(compile(code, 'main.py', 'exec'), ns)
    ns['_stdout'] = buf.getvalue()
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(tests, 'tests.py', 'exec'), ns)


def collect():
    """Собирает все Python-задачи из курсов: (ключ, tests, stdin)."""
    catalog = json.load(open(os.path.join(CONTENT, 'catalog.json'), encoding='utf-8'))
    out = []
    for meta in catalog['courses']:
        f = os.path.join(CONTENT, 'courses', meta['id'] + '.json')
        if not os.path.exists(f):
            continue
        course = json.load(open(f, encoding='utf-8'))
        for m in course['modules']:
            base = course['id'] + '/' + m['id']
            for task in m['tasks']:
                if task.get('kind') == 'python':
                    out.append((base + '/' + task['id'], task['tests'], task.get('stdin', [])))
            for i, task in enumerate(m.get('exam', {}).get('tasks', [])):
                if task.get('kind') == 'python':
                    out.append((base + '/exam' + str(i), task['tests'], task.get('stdin', [])))
        fin = course.get('finalExam')
        if fin:
            for i, task in enumerate(fin.get('tasks', [])):
                if task.get('kind') == 'python':
                    out.append((course['id'] + '/final/task' + str(i), task['tests'], task.get('stdin', [])))
    return out


tasks = collect()
os.chdir(tempfile.mkdtemp())          # песочница для файловых задач
fails = []

for key, tests, stdin in tasks:
    sol = SOLUTIONS.get(key)
    if sol is None:
        fails.append((key, 'НЕТ ЭТАЛОННОГО РЕШЕНИЯ'))
        continue
    try:
        run_task(sol, tests, stdin)
    except AssertionError as e:
        fails.append((key, 'ТЕСТ УПАЛ: %s' % e))
    except Exception as e:
        fails.append((key, 'ОШИБКА: %r' % (e,)))

if fails:
    print('ПРОБЛЕМЫ (%d из %d):' % (len(fails), len(tasks)))
    for k, m in fails:
        print(' -', k, '->', m)
    sys.exit(1)
print('Задачи: все %d эталонных решений проходят автотесты ✔' % len(tasks))
