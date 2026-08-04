#!/bin/bash
# Ежедневный бэкап базы аккаунтов и прогресса PyQuest.
# Cron: 0 4 * * * /opt/pyquest-api/backup-db.sh
#
# Горячая копия делается штатным Python 3 (модуль sqlite3, метод Connection.backup) —
# это безопасно для работающей базы и не требует установки пакетов в систему.
# Хранится 14 последних копий, старые удаляются.

set -uo pipefail

DB="/opt/pyquest-api/pyquest.db"
DIR="/opt/pyquest-api/backups"
KEEP=14
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$DIR/pyquest-$STAMP.db"
LOG="/var/log/pyquest-backup.log"

mkdir -p "$DIR"

if [ ! -f "$DB" ]; then
  echo "$(date -Iseconds) ОШИБКА: база не найдена: $DB" >> "$LOG"
  exit 1
fi

# Горячий бэкап + количество пользователей для строки лога
USERS=$(python3 - "$DB" "$OUT" << 'PYEOF'
import sqlite3, sys
src_path, dst_path = sys.argv[1], sys.argv[2]
src = sqlite3.connect(src_path)
dst = sqlite3.connect(dst_path)
with dst:
    src.backup(dst)          # консистентная копия работающей базы
n = src.execute("SELECT COUNT(*) FROM users").fetchone()[0]
dst.close(); src.close()
print(n)
PYEOF
)

if [ ! -s "$OUT" ]; then
  echo "$(date -Iseconds) ОШИБКА: пустой бэкап $OUT" >> "$LOG"
  exit 1
fi

# Проверяем, что копия читается и содержит данные
CHECK=$(python3 -c "
import sqlite3, sys
try:
    c = sqlite3.connect('$OUT')
    c.execute('SELECT COUNT(*) FROM users').fetchone()
    c.execute('SELECT COUNT(*) FROM states').fetchone()
    print('ok')
except Exception as e:
    print('bad:', e)
")
if [ "$CHECK" != "ok" ]; then
  echo "$(date -Iseconds) ОШИБКА: бэкап не проходит проверку: $CHECK" >> "$LOG"
  exit 1
fi

gzip -f "$OUT"
SIZE=$(du -h "$OUT.gz" | cut -f1)

# Ротация: оставляем KEEP последних
ls -1t "$DIR"/pyquest-*.db.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "$(date -Iseconds) OK: $OUT.gz ($SIZE, пользователей: $USERS)" >> "$LOG"
