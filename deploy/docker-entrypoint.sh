#!/bin/sh
# Запуск PocketBase в контейнере (Render и любой Docker-хостинг).
# PB_ADMIN_EMAIL и PB_ADMIN_PASSWORD (если заданы) создают или обновляют суперпользователя при каждом старте.
set -eu

DATA_DIR="${PB_DATA_DIR:-/data/pb_data}"
PORT="${PORT:-10000}"
MIGRATIONS=/pb/pb_migrations

mkdir -p "$DATA_DIR"

if [ -n "${PB_ADMIN_EMAIL:-}" ] && [ -n "${PB_ADMIN_PASSWORD:-}" ]; then
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" \
    --dir="$DATA_DIR" --migrationsDir="$MIGRATIONS"
else
  echo "PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD не заданы: суперпользователь не создаётся" >&2
fi

exec /pb/pocketbase serve \
  --http="0.0.0.0:${PORT}" \
  --dir="$DATA_DIR" \
  --migrationsDir="$MIGRATIONS" \
  --publicDir=/pb/pb_public
