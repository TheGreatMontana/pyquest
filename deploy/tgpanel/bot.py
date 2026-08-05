#!/usr/bin/env python3
"""tgpanel — управление проектами сервера из Telegram.

Что умеет: показать статус, включить, выключить и перезапустить проект.
Чего не умеет намеренно: удалять что-либо и выполнять произвольные команды.

Три правила безопасности, на которых всё держится:
  1. Команды принимаются только от ADMIN_ID. Остальные молча игнорируются.
  2. Работа идёт по белому списку: имена сервисов и контейнеров заданы здесь,
     из сообщения они не берутся никогда — подставить своё имя невозможно.
  3. Токен читается из окружения (файл с правами 600), в коде его нет.

Зависимостей нет: только стандартная библиотека Python 3.
Запуск: systemd-юнит tgpanel.service.
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TOKEN = os.environ.get('TG_TOKEN', '').strip()
ADMIN_ID = int(os.environ.get('TG_ADMIN', '0'))
API = 'https://api.telegram.org/bot%s/' % TOKEN

if not TOKEN or not ADMIN_ID:
    print('нет TG_TOKEN или TG_ADMIN в окружении', file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------- проекты
# Белый список. Всё, чем бот может управлять, перечислено здесь и только здесь.
PROJECTS = {
    'wazuh': {
        'title': 'Wazuh',
        'note': 'мониторинг безопасности, ест больше всех памяти',
        'services': ['wazuh-dashboard', 'wazuh-indexer', 'wazuh-manager', 'wazuh-bot'],
        'containers': [],
        # Порядок остановки — обратный порядку запуска: сначала то, что сверху
        'heavy': True,
    },
    'doubleasec': {
        'title': 'DoubleASec',
        'note': 'бэкенд, база, воркеры и RustDesk',
        'services': ['doubleasec-webagent'],
        'containers': [
            'doubleasec-backend-1', 'doubleasec-postgres-1', 'doubleasec-redis-1',
            'doubleasec-web-worker-1', 'doubleasec-hbbs', 'doubleasec-hbbr',
            'doubleasec-wazuh-worker-1', 'doubleasec-camera-worker-1',
            'doubleasec-netscan-worker-1', 'doubleasec-monitor-worker-1',
            'doubleasec-notifier-worker-1',
        ],
    },
    'wedding': {
        'title': 'Wedding',
        'note': 'сайт приглашений',
        'services': ['wedding-api'],
        'containers': [],
    },
    'pyquest': {
        'title': 'PyQuest',
        'note': 'платформа обучения (аккаунты и прогресс)',
        'services': ['pyquest-api'],
        'containers': [],
    },
    'schoolbot': {
        'title': 'SchoolBot',
        'note': 'школьный бот',
        'services': ['schoolbot'],
        'containers': [],
    },
}

ACTIONS = {'start': 'start', 'stop': 'stop', 'restart': 'restart'}


# ---------------------------------------------------------------- система
def sh(args, timeout=90):
    """Запуск команды списком аргументов: строка от пользователя сюда не попадает."""
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout or '') + (r.stderr or '')
    except subprocess.TimeoutExpired:
        return 124, 'команда не уложилась во время'
    except Exception as e:                                    # noqa: BLE001
        return 1, str(e)


def service_state(name):
    code, out = sh(['systemctl', 'is-active', name], timeout=15)
    return out.strip() or 'unknown'


def container_state(name):
    code, out = sh(['docker', 'inspect', '-f', '{{.State.Status}}', name], timeout=20)
    return out.strip() if code == 0 else 'нет'


def project_state(key):
    """Сводное состояние: работает, если работает хоть одна часть."""
    p = PROJECTS[key]
    running = stopped = 0
    for s in p['services']:
        if service_state(s) == 'active':
            running += 1
        else:
            stopped += 1
    for c in p['containers']:
        if container_state(c) == 'running':
            running += 1
        else:
            stopped += 1
    total = running + stopped
    if running == 0:
        return 'stopped', running, total
    if stopped == 0:
        return 'running', running, total
    return 'partial', running, total


def do_action(key, action):
    """Выполняет действие над всеми частями проекта. Возвращает отчёт строкой."""
    p = PROJECTS[key]
    cmd = ACTIONS[action]
    lines = []

    services = p['services']
    containers = p['containers']
    # Останавливаем в обратном порядке: зависимые части первыми
    if action == 'stop':
        services = list(reversed(services))
        containers = list(reversed(containers))

    for s in services:
        code, out = sh(['systemctl', cmd, s])
        lines.append(('✓' if code == 0 else '✗') + ' ' + s +
                     ('' if code == 0 else ' — ' + out.strip()[:80]))
    for c in containers:
        code, out = sh(['docker', cmd, c])
        lines.append(('✓' if code == 0 else '✗') + ' ' + c +
                     ('' if code == 0 else ' — ' + out.strip()[:80]))
    return '\n'.join(lines) or 'нечего делать'


def memory():
    code, out = sh(['free', '-m'], timeout=15)
    for line in out.splitlines():
        if line.lower().startswith('mem'):
            parts = line.split()
            total, used, free = int(parts[1]), int(parts[2]), int(parts[3])
            avail = int(parts[-1])
            return total, used, avail
    return 0, 0, 0


def disk():
    code, out = sh(['df', '-h', '/'], timeout=15)
    rows = out.strip().splitlines()
    if len(rows) < 2:
        return '?', '?'
    parts = rows[1].split()
    return parts[3], parts[4]          # свободно, использовано в процентах


# ---------------------------------------------------------------- Telegram
def api(method, **params):
    data = urllib.parse.urlencode(
        {k: (json.dumps(v) if isinstance(v, (dict, list)) else v)
         for k, v in params.items() if v is not None}).encode()
    req = urllib.request.Request(API + method, data=data)
    try:
        with urllib.request.urlopen(req, timeout=70) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {'ok': False, 'error': e.read().decode()[:200]}
    except Exception as e:                                    # noqa: BLE001
        return {'ok': False, 'error': str(e)}


ICON = {'running': '🟢', 'stopped': '⚪️', 'partial': '🟡'}


def main_text():
    total, used, avail = memory()
    free_disk, used_pct = disk()
    lines = ['*Панель сервера*', '']
    for key in PROJECTS:
        state, run, tot = project_state(key)
        lines.append('%s *%s* — %d из %d' % (ICON[state], PROJECTS[key]['title'], run, tot))
    lines += ['', 'Память: %d из %d МБ занято, свободно %d МБ' % (used, total, avail),
              'Диск: занято %s, свободно %s' % (used_pct, free_disk)]
    return '\n'.join(lines)


def main_keyboard():
    rows = []
    for key in PROJECTS:
        state, _, _ = project_state(key)
        rows.append([{'text': ICON[state] + ' ' + PROJECTS[key]['title'],
                      'callback_data': 'open:' + key}])
    rows.append([{'text': '🔄 Обновить', 'callback_data': 'home'}])
    return {'inline_keyboard': rows}


def project_keyboard(key):
    return {'inline_keyboard': [
        [{'text': '▶️ Включить', 'callback_data': 'act:%s:start' % key},
         {'text': '⏹ Выключить', 'callback_data': 'act:%s:stop' % key}],
        [{'text': '🔁 Перезапустить', 'callback_data': 'act:%s:restart' % key}],
        [{'text': '‹ Назад', 'callback_data': 'home'}],
    ]}


def project_text(key):
    p = PROJECTS[key]
    state, run, tot = project_state(key)
    lines = ['%s *%s*' % (ICON[state], p['title']), '_%s_' % p['note'], '',
             'Работает частей: %d из %d' % (run, tot), '']
    for s in p['services']:
        st = service_state(s)
        lines.append(('🟢' if st == 'active' else '⚪️') + ' ' + s)
    for c in p['containers']:
        st = container_state(c)
        lines.append(('🟢' if st == 'running' else '⚪️') + ' ' + c)
    return '\n'.join(lines)


def send(text, keyboard=None):
    return api('sendMessage', chat_id=ADMIN_ID, text=text,
               parse_mode='Markdown', reply_markup=keyboard)


def edit(message_id, text, keyboard=None):
    return api('editMessageText', chat_id=ADMIN_ID, message_id=message_id,
               text=text, parse_mode='Markdown', reply_markup=keyboard)


# ---------------------------------------------------------------- цикл
def handle_message(msg):
    text = (msg.get('text') or '').strip().lower()
    if text.startswith('/start') or text.startswith('/status') or text.startswith('/panel'):
        send(main_text(), main_keyboard())
    else:
        send('Команды: /status — панель управления.', main_keyboard())


def handle_callback(cq):
    data = cq.get('data') or ''
    mid = cq['message']['message_id']

    if data == 'home':
        edit(mid, main_text(), main_keyboard())
        api('answerCallbackQuery', callback_query_id=cq['id'])
        return

    if data.startswith('open:'):
        key = data.split(':', 1)[1]
        if key in PROJECTS:
            edit(mid, project_text(key), project_keyboard(key))
        api('answerCallbackQuery', callback_query_id=cq['id'])
        return

    if data.startswith('act:'):
        _, key, action = (data.split(':') + ['', ''])[:3]
        # Ключ и действие сверяются с белым списком — произвольного сюда не попадёт
        if key not in PROJECTS or action not in ACTIONS:
            api('answerCallbackQuery', callback_query_id=cq['id'], text='Неизвестная команда')
            return
        api('answerCallbackQuery', callback_query_id=cq['id'], text='Выполняю…')
        edit(mid, '⏳ %s: %s…' % (PROJECTS[key]['title'], action), None)
        report = do_action(key, action)
        edit(mid, project_text(key) + '\n\n```\n' + report + '\n```', project_keyboard(key))
        return

    api('answerCallbackQuery', callback_query_id=cq['id'])


def main():
    offset = None
    send('Панель запущена.', main_keyboard())
    while True:
        res = api('getUpdates', offset=offset, timeout=60)
        if not res.get('ok'):
            time.sleep(5)
            continue
        for upd in res.get('result', []):
            offset = upd['update_id'] + 1
            msg = upd.get('message') or upd.get('edited_message')
            cq = upd.get('callback_query')

            # Единственная проверка прав: чужие сообщения не обрабатываются вовсе
            who = (msg or cq or {}).get('from', {}).get('id')
            if who != ADMIN_ID:
                continue

            try:
                if cq:
                    handle_callback(cq)
                elif msg:
                    handle_message(msg)
            except Exception as e:                            # noqa: BLE001
                # Сбой на одном сообщении не должен ронять бота целиком
                print('ошибка обработки:', e, file=sys.stderr)


if __name__ == '__main__':
    main()
