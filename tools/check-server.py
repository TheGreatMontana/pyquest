# -*- coding: utf-8 -*-
"""
check-server.py — тесты API аккаунтов и серверной валидации прогресса.

Ключевая проверка: валидация XP отсекает подделку, но НЕ мешает честному
пользователю с реальным прогрессом (ложные срабатывания дороже пропущенного читера).
"""
import os
import sys
import tempfile

os.environ['PYQUEST_DB'] = os.path.join(tempfile.mkdtemp(), 'test.db')
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'server'))
import app as api  # noqa: E402

c = api.app.test_client()
fails = []


def check(name, cond, extra=''):
    if cond:
        print('  ok:', name)
    else:
        fails.append(name + (' | ' + str(extra) if extra else ''))


def module(theory=True, quiz=100, tasks=3, exam=85, perfect=False, blocks=0):
    return {
        'theory': theory, 'quizBest': quiz,
        'tasks': {('t%d' % i): True for i in range(tasks)},
        'blocks': {('l1:%d' % i): True for i in range(blocks)},
        'examBest': exam, 'examPerfect': perfect,
    }


# ---------- регистрация ----------
r = c.post('/api/register', json={'username': 'aziz', 'password': 'secret1'})
check('регистрация', r.status_code == 200, r.get_json())
H = {'Authorization': 'Bearer ' + r.get_json()['token']}

# ---------- честный прогресс проходит ----------
honest = {
    'schemaVersion': 2, 'xp': 340, 'streak': 2,
    'modules': {
        'python-basics/pb-01': module(),
        'python-basics/pb-02': module(),
        'python-basics/pb-03': module(),
    },
    'finals': {}, 'courses': {}, 'ach': ['first-code'],
}
r = c.put('/api/state', json={'state': honest}, headers=H)
check('честный прогресс (340 XP за 3 модуля) принят', r.status_code == 200, r.get_json())

# Реалистичный «продвинутый» пользователь: весь Python-трек + SQL + проекты
advanced = {
    'schemaVersion': 2, 'xp': 4200, 'streak': 30,
    'modules': {('c/m%d' % i): module(tasks=3, blocks=4, perfect=(i % 3 == 0)) for i in range(20)},
    'finals': {'python-advanced': 92},
    'courses': {'python-basics': {'completedAt': 'x'}, 'sql-basics': {'completedAt': 'x'}},
    'projects': {'etl-pipeline': {'milestones': {'m1': True, 'm2': True, 'm3': True}, 'completedAt': 'x'}},
}
r = c.put('/api/state', json={'state': advanced}, headers=H)
check('прогресс опытного пользователя (4200 XP) принят', r.status_code == 200, r.get_json())

# Граничный случай: свежий аккаунт, немного XP
r = c.put('/api/state', json={'state': {'xp': 30, 'modules': {'c/m1': module(quiz=0, tasks=0, exam=0)}}}, headers=H)
check('новичок с 30 XP принят', r.status_code == 200, r.get_json())

# ---------- подделка отсекается ----------
r = c.put('/api/state', json={'state': {'xp': 999999, 'modules': {}}}, headers=H)
check('накрутка 999999 XP без прогресса отклонена', r.status_code == 422, r.get_json())

r = c.put('/api/state', json={'state': {'xp': 50000, 'modules': {'c/m1': module()}}}, headers=H)
check('50000 XP за один модуль отклонены', r.status_code == 422, r.get_json())

r = c.put('/api/state', json={'state': {'xp': -100}}, headers=H)
check('отрицательный XP отклонён', r.status_code == 422)

r = c.put('/api/state', json={'state': {'xp': 'много'}}, headers=H)
check('XP строкой отклонён', r.status_code == 422)

r = c.put('/api/state', json={'state': {'xp': 100, 'streak': 99999}}, headers=H)
check('невозможный стрик отклонён', r.status_code == 422)

r = c.put('/api/state', json={'state': {'xp': 10, 'modules': {('c/m%d' % i): module() for i in range(600)}}}, headers=H)
check('600 модулей отклонены', r.status_code == 422)

# ---------- отказ не портит сохранённые данные ----------
saved = c.get('/api/state', headers=H).get_json()['state']
check('после отказа сохранён последний ВАЛИДНЫЙ прогресс', saved['xp'] == 30, saved['xp'])

# ---------- старый формат (до миграции) не наказывается ----------
legacy = {'xp': 340, 'mods': {'m01': {'theory': True}, 'm02': {'theory': True}, 'm03': {'theory': True}}}
r = c.put('/api/state', json={'state': legacy}, headers=H)
check('прогресс в старом формате v1 принят', r.status_code == 200, r.get_json())

# ---------- предупреждение об откате прогресса ----------
c.put('/api/state', json={'state': advanced}, headers=H)
r = c.put('/api/state', json={'state': {'xp': 100, 'modules': {'c/m1': module()}}}, headers=H)
data = r.get_json()
check('резкое падение прогресса помечается предупреждением',
      r.status_code == 200 and 'warning' in data, data)

# ---------- прочее API ----------
check('чужой токен не даёт доступ', c.get('/api/state', headers={'Authorization': 'Bearer x'}).status_code == 401)
check('без токена нет доступа', c.get('/api/state').status_code == 401)
r = c.post('/api/register', json={'username': 'timur', 'password': 'secret2'})
H2 = {'Authorization': 'Bearer ' + r.get_json()['token']}
check('у нового пользователя пустой прогресс', c.get('/api/state', headers=H2).get_json()['state'] is None)

if fails:
    print('\nПРОВАЛЫ (%d):' % len(fails))
    for f in fails:
        print(' ✗', f)
    sys.exit(1)
print('\nТест сервера: валидация прогресса работает, честных не блокирует ✔')
