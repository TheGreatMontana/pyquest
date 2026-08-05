# PyQuest API — аккаунты и синхронизация прогресса
# Flask + SQLite. Работает за nginx (проксирование /api/ -> 127.0.0.1:8611).
import hashlib
import json
import os
import re
import secrets
import sqlite3
import time

from flask import Flask, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

DB_PATH = os.environ.get('PYQUEST_DB', '/opt/pyquest-api/pyquest.db')
MAX_STATE_BYTES = 256 * 1024  # прогресс - маленький JSON, больше 256КБ - подозрительно
USERNAME_RE = re.compile(r'^[a-zA-Z0-9_.\-а-яА-ЯёЁ]{3,20}$')

# --- Лимиты для валидации прогресса ---
# XP начисляется на клиенте, но сервер не обязан верить любому числу.
# Здесь мы считаем максимально возможный XP по заявленным достижениям и
# отвергаем состояния, где заявленный XP заметно больше заработанного.
XP_RATES = {
    'lesson': 20, 'quizAnswer': 10, 'task': 40,
    'examPass': 120, 'examPerfect': 60, 'finalPass': 300,
    'courseComplete': 100, 'interactiveBlock': 15,
    'milestone': 50, 'projectComplete': 600,
}
XP_TOLERANCE = 1.25   # запас на смену тарифов и старые начисления
MAX_MODULES = 500
MAX_XP = 1_000_000

app = Flask(__name__)

# наивная защита от перебора паролей: username -> [timestamps]
_fails = {}


def db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA journal_mode=WAL')
    return g.db


@app.teardown_appcontext
def _close(exc):
    d = g.pop('db', None)
    if d is not None:
        d.close()


def init_db():
    with sqlite3.connect(DB_PATH) as d:
        d.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT UNIQUE COLLATE NOCASE NOT NULL,
                pass_hash TEXT NOT NULL,
                created INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                created INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS states (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                data TEXT NOT NULL,
                updated INTEGER NOT NULL
            );
        ''')


def migrate_db():
    """Добавляет is_admin, если его ещё нет. Существующие строки не трогаются.

    Проверка «есть ли колонка» и ALTER — это два разных запроса, а воркеров
    gunicorn несколько и стартуют они одновременно: второй успевал добавить
    колонку между проверкой и добавлением у первого, и тот падал. Поэтому
    ошибку о дубликате просто принимаем — значит, сосед уже всё сделал.
    """
    with sqlite3.connect(DB_PATH) as d:
        cols = [r[1] for r in d.execute('PRAGMA table_info(users)')]
        if 'is_admin' in cols:
            return
        try:
            d.execute('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0')
        except sqlite3.OperationalError as e:
            if 'duplicate column' not in str(e).lower():
                raise


init_db()
migrate_db()


def _token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def issue_token(user_id):
    token = secrets.token_hex(32)
    db().execute('INSERT INTO sessions (token_hash, user_id, created) VALUES (?, ?, ?)',
                 (_token_hash(token), user_id, int(time.time())))
    db().commit()
    return token


def current_user():
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    row = db().execute('SELECT user_id FROM sessions WHERE token_hash = ?',
                       (_token_hash(header[7:]),)).fetchone()
    return row['user_id'] if row else None


def is_admin(user_id):
    row = db().execute('SELECT is_admin FROM users WHERE id = ?', (user_id,)).fetchone()
    return bool(row and row['is_admin'])


def require_admin():
    """Возвращает id администратора либо None. Флаг живёт в базе, а не в токене:
    отозвать права можно немедленно, не дожидаясь, пока истечёт сессия."""
    uid = current_user()
    if uid is None or not is_admin(uid):
        return None
    return uid


def too_many_fails(username):
    now = time.time()
    recent = [t for t in _fails.get(username, []) if now - t < 600]
    _fails[username] = recent
    return len(recent) >= 10


@app.get('/api/health')
def health():
    return jsonify(ok=True)


@app.post('/api/register')
def register():
    body = request.get_json(silent=True) or {}
    username = str(body.get('username', '')).strip()
    password = str(body.get('password', ''))
    if not USERNAME_RE.match(username):
        return jsonify(error='Логин: 3-20 символов, только буквы, цифры, точка, дефис и _'), 400
    if len(password) < 6:
        return jsonify(error='Пароль: минимум 6 символов'), 400
    try:
        cur = db().execute('INSERT INTO users (username, pass_hash, created) VALUES (?, ?, ?)',
                           (username, generate_password_hash(password), int(time.time())))
        db().commit()
    except sqlite3.IntegrityError:
        return jsonify(error='Этот логин уже занят'), 409
    return jsonify(token=issue_token(cur.lastrowid), username=username, is_admin=False)


@app.post('/api/login')
def login():
    body = request.get_json(silent=True) or {}
    username = str(body.get('username', '')).strip()
    password = str(body.get('password', ''))
    if too_many_fails(username):
        return jsonify(error='Слишком много попыток. Подожди 10 минут'), 429
    row = db().execute('SELECT id, username, pass_hash, is_admin FROM users WHERE username = ?',
                       (username,)).fetchone()
    if not row or not check_password_hash(row['pass_hash'], password):
        _fails.setdefault(username, []).append(time.time())
        return jsonify(error='Неверный логин или пароль'), 401
    return jsonify(token=issue_token(row['id']), username=row['username'],
                   is_admin=bool(row['is_admin']))


@app.post('/api/logout')
def logout():
    header = request.headers.get('Authorization', '')
    if header.startswith('Bearer '):
        db().execute('DELETE FROM sessions WHERE token_hash = ?', (_token_hash(header[7:]),))
        db().commit()
    return jsonify(ok=True)


def max_reasonable_xp(state):
    """
    Верхняя граница XP, которую пользователь мог заработать при заявленном прогрессе.

    Считаем щедро (в пользу пользователя): берём максимум по каждому виду активности,
    добавляем запас. Задача не поймать «оптимизатора на 10 XP», а отсечь состояния,
    где XP явно нарисован — например, миллион при трёх пройденных модулях.
    """
    total = 0
    modules = state.get('modules') or {}
    if isinstance(modules, dict):
        for m in list(modules.values())[:MAX_MODULES]:
            if not isinstance(m, dict):
                continue
            if m.get('theory'):
                total += XP_RATES['lesson']
            # квиз: неизвестно число вопросов, берём щедрые 15 на модуль
            if m.get('quizBest'):
                total += XP_RATES['quizAnswer'] * 15
            tasks = m.get('tasks') or {}
            if isinstance(tasks, dict):
                total += XP_RATES['task'] * len(tasks)
            blocks = m.get('blocks') or {}
            if isinstance(blocks, dict):
                total += XP_RATES['interactiveBlock'] * len(blocks)
            if (m.get('examBest') or 0) >= 70:
                total += XP_RATES['examPass']
            if m.get('examPerfect'):
                total += XP_RATES['examPerfect']

    finals = state.get('finals') or {}
    if isinstance(finals, dict):
        total += XP_RATES['finalPass'] * len(finals)

    courses = state.get('courses') or {}
    if isinstance(courses, dict):
        total += XP_RATES['courseComplete'] * len(courses)

    projects = state.get('projects') or {}
    if isinstance(projects, dict):
        for p in list(projects.values())[:100]:
            if not isinstance(p, dict):
                continue
            ms = p.get('milestones') or {}
            if isinstance(ms, dict):
                total += XP_RATES['milestone'] * len(ms)
            if p.get('completedAt'):
                total += XP_RATES['projectComplete']

    # Старый формат до миграции — засчитываем так же, чтобы не наказать за апгрейд
    legacy = state.get('mods') or state.get('legacyMods') or {}
    if isinstance(legacy, dict):
        total += 300 * len(legacy)

    return int(total * XP_TOLERANCE) + 500   # базовый запас на округления


def validate_state(state, previous):
    """
    Проверяет присланный прогресс. Возвращает (ok, сообщение).
    Правила намеренно мягкие: цель — отсечь очевидную подделку, а не мешать учиться.
    """
    if not isinstance(state, dict):
        return False, 'Нужен объект state'

    xp = state.get('xp', 0)
    if not isinstance(xp, (int, float)) or xp < 0 or xp > MAX_XP:
        return False, 'Некорректное значение XP'

    streak = state.get('streak', 0)
    if not isinstance(streak, (int, float)) or streak < 0 or streak > 3650:
        return False, 'Некорректное значение стрика'

    modules = state.get('modules') or {}
    if isinstance(modules, dict) and len(modules) > MAX_MODULES:
        return False, 'Слишком много модулей в прогрессе'

    limit = max_reasonable_xp(state)
    if xp > limit:
        return False, 'XP не соответствует прогрессу (заявлено %d, максимум по активности %d)' % (int(xp), limit)

    # Прогресс не должен внезапно откатываться назад: это признак повреждённых данных.
    # Мы не блокируем такой запрос (может быть законный сброс), но и не теряем старое —
    # решение принимает вызывающий код, здесь только сигнал.
    if previous and isinstance(previous, dict):
        prev_xp = previous.get('xp', 0)
        if isinstance(prev_xp, (int, float)) and xp < prev_xp * 0.5 and prev_xp > 200:
            return True, 'warn: прогресс уменьшился с %d до %d' % (int(prev_xp), int(xp))

    return True, ''


@app.get('/api/state')
def get_state():
    uid = current_user()
    if uid is None:
        return jsonify(error='Не авторизован'), 401
    row = db().execute('SELECT data, updated FROM states WHERE user_id = ?', (uid,)).fetchone()
    return jsonify(state=json.loads(row['data']) if row else None,
                   updated=row['updated'] if row else None)


@app.put('/api/state')
def put_state():
    uid = current_user()
    if uid is None:
        return jsonify(error='Не авторизован'), 401
    body = request.get_json(silent=True) or {}
    state = body.get('state')
    if not isinstance(state, dict):
        return jsonify(error='Нужен объект state'), 400

    raw = json.dumps(state, ensure_ascii=False)
    if len(raw.encode()) > MAX_STATE_BYTES:
        return jsonify(error='Слишком большой объём данных'), 413

    # Предыдущее состояние нужно и для проверки, и чтобы не потерять его при отказе
    prev_row = db().execute('SELECT data FROM states WHERE user_id = ?', (uid,)).fetchone()
    previous = None
    if prev_row:
        try:
            previous = json.loads(prev_row['data'])
        except ValueError:
            previous = None

    ok, message = validate_state(state, previous)
    if not ok:
        # Сохранённый ранее прогресс остаётся нетронутым
        return jsonify(error=message), 422

    db().execute('INSERT INTO states (user_id, data, updated) VALUES (?, ?, ?) '
                 'ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated',
                 (uid, raw, int(time.time())))
    db().commit()
    return jsonify(ok=True, warning=message) if message else jsonify(ok=True)


# ---------------------------------------------------------------- админ
# Права проверяются здесь и только здесь. Клиент показывает или прячет раздел,
# но решает всегда сервер: подделанный флаг в браузере ничего не даст.

def _user_row(uid):
    return db().execute('SELECT id, username, created, is_admin FROM users WHERE id = ?',
                        (uid,)).fetchone()


@app.get('/api/admin/users')
def admin_users():
    if require_admin() is None:
        return jsonify(error='Нужны права администратора'), 403

    rows = db().execute('''
        SELECT u.id, u.username, u.created, u.is_admin,
               s.updated AS last_seen, s.data AS state
        FROM users u
        LEFT JOIN states s ON s.user_id = u.id
        ORDER BY u.id
    ''').fetchall()

    users = []
    for r in rows:
        xp, modules, streak = 0, 0, 0
        if r['state']:
            try:
                st = json.loads(r['state'])
                xp = int(st.get('xp') or 0)
                streak = int(st.get('streak') or 0)
                modules = len(st.get('modules') or st.get('mods') or {})
            except (ValueError, TypeError):
                pass          # битое состояние не должно ронять весь список
        users.append({
            'id': r['id'],
            'username': r['username'],
            'created': r['created'],
            'is_admin': bool(r['is_admin']),
            'last_seen': r['last_seen'],
            'xp': xp,
            'modules': modules,
            'streak': streak,
        })
    # Хеши паролей наружу не отдаём ни при каких правах
    return jsonify(users=users, total=len(users))


@app.post('/api/admin/user/<int:target>/role')
def admin_set_role(target):
    me = require_admin()
    if me is None:
        return jsonify(error='Нужны права администратора'), 403
    if target == me:
        # Иначе последний администратор может случайно закрыть себе вход в раздел
        return jsonify(error='Свои права снимать нельзя'), 400
    if not _user_row(target):
        return jsonify(error='Пользователь не найден'), 404

    make_admin = bool((request.get_json(silent=True) or {}).get('is_admin'))
    db().execute('UPDATE users SET is_admin = ? WHERE id = ?', (1 if make_admin else 0, target))
    db().commit()
    return jsonify(ok=True, is_admin=make_admin)


@app.post('/api/admin/user/<int:target>/reset')
def admin_reset_progress(target):
    if require_admin() is None:
        return jsonify(error='Нужны права администратора'), 403
    if not _user_row(target):
        return jsonify(error='Пользователь не найден'), 404

    # Сам аккаунт остаётся: обнуляется только прогресс
    db().execute('DELETE FROM states WHERE user_id = ?', (target,))
    db().commit()
    return jsonify(ok=True)


@app.delete('/api/admin/user/<int:target>')
def admin_delete_user(target):
    me = require_admin()
    if me is None:
        return jsonify(error='Нужны права администратора'), 403
    if target == me:
        return jsonify(error='Свой аккаунт удалить нельзя'), 400
    row = _user_row(target)
    if not row:
        return jsonify(error='Пользователь не найден'), 404

    db().execute('DELETE FROM states WHERE user_id = ?', (target,))
    db().execute('DELETE FROM sessions WHERE user_id = ?', (target,))
    db().execute('DELETE FROM users WHERE id = ?', (target,))
    db().commit()
    return jsonify(ok=True, username=row['username'])


@app.get('/api/me')
def me():
    """Кто я и есть ли у меня права. Нужен интерфейсу после перезагрузки."""
    uid = current_user()
    if uid is None:
        return jsonify(error='Не авторизован'), 401
    row = _user_row(uid)
    return jsonify(username=row['username'], is_admin=bool(row['is_admin']))


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8611)
