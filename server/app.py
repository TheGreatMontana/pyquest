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


init_db()


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
    return jsonify(token=issue_token(cur.lastrowid), username=username)


@app.post('/api/login')
def login():
    body = request.get_json(silent=True) or {}
    username = str(body.get('username', '')).strip()
    password = str(body.get('password', ''))
    if too_many_fails(username):
        return jsonify(error='Слишком много попыток. Подожди 10 минут'), 429
    row = db().execute('SELECT id, username, pass_hash FROM users WHERE username = ?',
                       (username,)).fetchone()
    if not row or not check_password_hash(row['pass_hash'], password):
        _fails.setdefault(username, []).append(time.time())
        return jsonify(error='Неверный логин или пароль'), 401
    return jsonify(token=issue_token(row['id']), username=row['username'])


@app.post('/api/logout')
def logout():
    header = request.headers.get('Authorization', '')
    if header.startswith('Bearer '):
        db().execute('DELETE FROM sessions WHERE token_hash = ?', (_token_hash(header[7:]),))
        db().commit()
    return jsonify(ok=True)


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
    db().execute('INSERT INTO states (user_id, data, updated) VALUES (?, ?, ?) '
                 'ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated',
                 (uid, raw, int(time.time())))
    db().commit()
    return jsonify(ok=True)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8611)
