# DEPLOYMENT.md — развёртывание и обновление

## 1. Что где живёт

| Компонент | Расположение |
|---|---|
| Статика платформы | `/var/www/course` (владелец `www-data`) |
| API аккаунтов | `/opt/pyquest-api` (Flask + gunicorn, systemd-сервис `pyquest-api`) |
| База аккаунтов и прогресса | `/opt/pyquest-api/pyquest.db` (SQLite) |
| Конфиг nginx | `/etc/nginx/sites-available/course` → symlink в `sites-enabled` |
| Сертификат | Let's Encrypt, автопродление certbot |
| Домен | `course.azizbek-azimov.uz` → `37.27.15.73` |

**Границы:** PyQuest занимает только эти пути. Соседние проекты на сервере (`doubleasec`, `wazuh`, `wedding`) и общесистемные конфиги не затрагиваются.

## 2. Обновление статики (обычный деплой)

```bash
cd /путь/к/pyquest
scp -i ~/.ssh/id_hetzner -r index.html css js content root@37.27.15.73:/var/www/course/
ssh -i ~/.ssh/id_hetzner root@37.27.15.73 "chown -R www-data:www-data /var/www/course"
```

**Обязательный шаг: инвалидация кэша.** nginx кэширует css/js на 7 дней, поэтому при каждом релизе поднимаем версию в `index.html`:

```html
<link rel="stylesheet" href="css/style.css?v=7">
<script>window.PQ_VERSION = '7';</script>
<script type="module" src="js/app.js?v=7"></script>
```

`PQ_VERSION` подставляется в запросы контента (`content/**.json`), поэтому одна правка версии обновляет и код, и данные. HTML не кэшируется (`Cache-Control: no-cache`), так что новая версия подхватывается сразу, без Ctrl+F5.

## 3. Обновление API

```bash
scp -i ~/.ssh/id_hetzner server/app.py root@37.27.15.73:/opt/pyquest-api/app.py
ssh -i ~/.ssh/id_hetzner root@37.27.15.73 "systemctl restart pyquest-api && systemctl is-active pyquest-api"
```

Схема БД создаётся автоматически при старте (`CREATE TABLE IF NOT EXISTS`), миграций не требуется.

## 4. Первичная установка API (если разворачивать заново)

```bash
mkdir -p /opt/pyquest-api && cd /opt/pyquest-api
python3 -m venv venv && venv/bin/pip install flask gunicorn
# скопировать app.py
chown -R www-data:www-data /opt/pyquest-api

cat > /etc/systemd/system/pyquest-api.service << 'EOF'
[Unit]
Description=PyQuest API (accounts and progress sync)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/pyquest-api
ExecStart=/opt/pyquest-api/venv/bin/gunicorn -w 2 -b 127.0.0.1:8611 app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload && systemctl enable --now pyquest-api
```

Конфиг nginx — в `deploy/course.nginx.conf`; блок HTTPS добавляет `certbot --nginx -d course.azizbek-azimov.uz`.

## 5. Обязательные проверки перед деплоем

```bash
node tools/validate.js         # структура контента и ссылочная целостность
python tools/check-python.py   # Python-фрагменты компилируются и выполняются
node tools/check-sql.js        # SQL выполняется на реальном движке
python tools/check-tasks.py    # каждая задача решаема эталонным решением
node tools/check-ui.mjs        # миграция прогресса, граф, XP, языки
node tools/check-screens.mjs   # все экраны рендерятся
```

Все шесть должны быть зелёными. `check-ui.mjs` особенно важен: он проверяет, что прогресс пользователей переживает обновление.

## 6. Проверка после деплоя

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://course.azizbek-azimov.uz/
curl -s https://course.azizbek-azimov.uz/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://course.azizbek-azimov.uz/content/catalog.json
# соседние проекты не пострадали:
curl -s -o /dev/null -w "%{http_code}\n" https://wedding.azizbek-azimov.uz/
```

## 7. Бэкап данных

```bash
# ручной бэкап БД перед рискованными изменениями
ssh root@37.27.15.73 "mkdir -p /opt/pyquest-api/backups && \
  cp /opt/pyquest-api/pyquest.db /opt/pyquest-api/backups/pyquest-$(date +%Y%m%d-%H%M%S).db"
```

Автоматических бэкапов пока нет — при росте числа пользователей стоит добавить ежедневный cron с выгрузкой за пределы сервера.

## 8. Локальная разработка

Нужен статический сервер (ES-модули не работают через `file://`):

```bash
python -m http.server 8000
# http://localhost:8000
```

API при этом недоступен — экран входа покажет ошибку сети. Для полноценной локальной работы:

```bash
cd server && PYQUEST_DB=./dev.db python app.py     # поднимет API на 127.0.0.1:8611
```
…и проксировать `/api/` на этот порт (или временно указать абсолютный URL в `js/core/state.js`).

## 9. Откат

```bash
git checkout main
scp -r index.html css js data root@37.27.15.73:/var/www/course/
ssh root@37.27.15.73 "cp /opt/pyquest-api/backups/<дата>.db /opt/pyquest-api/pyquest.db && systemctl restart pyquest-api"
```
