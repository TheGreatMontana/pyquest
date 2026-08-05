"""check-admin.py — проверка админского раздела.

Главное, что здесь проверяется: обычный пользователь не может ничего из
админского, даже если очень попросит. Права живут в базе, а не в токене,
поэтому отзыв действует немедленно.

Запуск: python tools/check-admin.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'server'))

# База — временная, настоящую не трогаем
TMP = tempfile.mkdtemp(prefix='pyquest-admin-')
os.environ['PYQUEST_DB'] = os.path.join(TMP, 'test.db')

import app as server  # noqa: E402

server.app.config['TESTING'] = True
client = server.app.test_client()

fails = []


def check(name, cond, extra=None):
    if cond:
        print('  ok:', name)
    else:
        fails.append(name + ('' if extra is None else ' | ' + str(extra)))


def reg(username, password='secret123'):
    r = client.post('/api/register', json={'username': username, 'password': password})
    return r.get_json()


def auth(token):
    return {'Authorization': 'Bearer ' + token}


# ---------- подготовка ----------
boss = reg('boss')
plain = reg('plain')
check('регистрация выдаёт токен', bool(boss.get('token')))
check('новый пользователь не администратор', boss.get('is_admin') is False, boss.get('is_admin'))

with server.app.app_context():
    server.db().execute('UPDATE users SET is_admin = 1 WHERE username = ?', ('boss',))
    server.db().commit()

# ---------- обычный пользователь никуда не проходит ----------
for method, path in [('get', '/api/admin/users'),
                     ('post', '/api/admin/user/1/reset'),
                     ('post', '/api/admin/user/1/role'),
                     ('delete', '/api/admin/user/1')]:
    r = getattr(client, method)(path, headers=auth(plain['token']), json={})
    check(f'обычному пользователю отказано: {method.upper()} {path}', r.status_code == 403, r.status_code)

# ---------- без токена тоже ----------
r = client.get('/api/admin/users')
check('без токена доступа нет', r.status_code == 403, r.status_code)

r = client.get('/api/admin/users', headers=auth('поддельный-токен'))
check('поддельный токен не работает', r.status_code == 403, r.status_code)

# ---------- администратор видит список ----------
r = client.get('/api/admin/users', headers=auth(boss['token']))
check('администратор получает список', r.status_code == 200, r.status_code)
data = r.get_json()
check('в списке оба пользователя', data['total'] == 2, data['total'])

names = sorted(u['username'] for u in data['users'])
check('имена на месте', names == ['boss', 'plain'], names)
check('флаг прав виден', any(u['is_admin'] for u in data['users']))

raw = json.dumps(data)
check('хеши паролей не утекают', 'pass_hash' not in raw and 'pbkdf2' not in raw and 'scrypt' not in raw)

# ---------- статистика подтягивается из прогресса ----------
client.put('/api/state', headers=auth(plain['token']),
           json={'state': {'xp': 340, 'streak': 3, 'modules': {'python-basics/pb-01': {'theory': True}}}})
r = client.get('/api/admin/users', headers=auth(boss['token']))
row = [u for u in r.get_json()['users'] if u['username'] == 'plain'][0]
check('XP пользователя виден администратору', row['xp'] == 340, row['xp'])
check('число модулей посчитано', row['modules'] == 1, row['modules'])
check('стрик виден', row['streak'] == 3, row['streak'])

# ---------- выдача и снятие прав ----------
plain_id = [u['id'] for u in r.get_json()['users'] if u['username'] == 'plain'][0]
boss_id = [u['id'] for u in r.get_json()['users'] if u['username'] == 'boss'][0]

r = client.post(f'/api/admin/user/{plain_id}/role', headers=auth(boss['token']), json={'is_admin': True})
check('права выданы', r.status_code == 200 and r.get_json()['is_admin'] is True)

r = client.get('/api/admin/users', headers=auth(plain['token']))
check('новый администратор сразу получил доступ', r.status_code == 200, r.status_code)

r = client.post(f'/api/admin/user/{plain_id}/role', headers=auth(boss['token']), json={'is_admin': False})
check('права сняты', r.status_code == 200 and r.get_json()['is_admin'] is False)

r = client.get('/api/admin/users', headers=auth(plain['token']))
check('отзыв прав действует немедленно, старый токен не спасает', r.status_code == 403, r.status_code)

# ---------- защита от самострела ----------
r = client.post(f'/api/admin/user/{boss_id}/role', headers=auth(boss['token']), json={'is_admin': False})
check('нельзя снять права с самого себя', r.status_code == 400, r.status_code)

r = client.delete(f'/api/admin/user/{boss_id}', headers=auth(boss['token']))
check('нельзя удалить свой аккаунт', r.status_code == 400, r.status_code)

r = client.delete('/api/admin/user/99999', headers=auth(boss['token']))
check('несуществующий пользователь — 404', r.status_code == 404, r.status_code)

# ---------- сброс прогресса не трогает аккаунт ----------
r = client.post(f'/api/admin/user/{plain_id}/reset', headers=auth(boss['token']))
check('прогресс сброшен', r.status_code == 200, r.status_code)

r = client.get('/api/state', headers=auth(plain['token']))
check('после сброса прогресс пуст', (r.get_json() or {}).get('state') in (None, {}), r.get_json())

r = client.post('/api/login', json={'username': 'plain', 'password': 'secret123'})
check('аккаунт после сброса цел, вход работает', r.status_code == 200, r.status_code)

# ---------- удаление ----------
r = client.delete(f'/api/admin/user/{plain_id}', headers=auth(boss['token']))
check('пользователь удалён', r.status_code == 200, r.status_code)

r = client.post('/api/login', json={'username': 'plain', 'password': 'secret123'})
check('удалённый войти не может', r.status_code == 401, r.status_code)

r = client.get('/api/admin/users', headers=auth(boss['token']))
check('в списке остался один', r.get_json()['total'] == 1, r.get_json()['total'])

# ---------- /api/me ----------
r = client.get('/api/me', headers=auth(boss['token']))
check('/api/me сообщает права', r.get_json().get('is_admin') is True, r.get_json())
r = client.get('/api/me')
check('/api/me без токена — 401', r.status_code == 401, r.status_code)

if fails:
    print('\nПРОВАЛЫ (%d):' % len(fails))
    for f in fails:
        print('  ✗', f)
    sys.exit(1)
print('\nТест админки: посторонних не пускает, права работают ✔')
