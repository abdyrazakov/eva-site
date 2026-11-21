#!/usr/bin/env bash
# Резервная копия данных PocketBase (базы и загруженных файлов). Хранит 14 последних копий.
# Запуск раз в сутки из cron, например: 15 3 * * * /srv/eva-site/deploy/backup.sh
set -euo pipefail

DATA_DIR="${DATA_DIR:-/srv/eva-site/backend/pb_data}"
BACKUP_DIR="${BACKUP_DIR:-/srv/eva-site/backups}"
KEEP="${KEEP:-14}"

stamp="$(date +%Y-%m-%d_%H%M%S)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

mkdir -p "$BACKUP_DIR"

# Базы копируем через встроенный механизм SQLite: это безопасно, пока сайт работает.
for db in data.db auxiliary.db; do
  if [ -f "$DATA_DIR/$db" ]; then
    sqlite3 "$DATA_DIR/$db" ".backup '$work/$db'"
  fi
done
if [ -d "$DATA_DIR/storage" ]; then
  cp -r "$DATA_DIR/storage" "$work/storage"
fi

tar -czf "$BACKUP_DIR/eva-$stamp.tar.gz" -C "$work" .

# Оставляем только последние $KEEP копий.
ls -1t "$BACKUP_DIR"/eva-*.tar.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --
echo "Резервная копия создана: $BACKUP_DIR/eva-$stamp.tar.gz"
