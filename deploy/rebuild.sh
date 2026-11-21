#!/usr/bin/env bash
# Пересобирает сайт и обновляет запасной снимок данных (его видят посетители, если PocketBase недоступен).
# Актуальные цены и фото сайт и так берёт напрямую из PocketBase, поэтому пересборка нужна
# для свежего снимка и после обновления кода. Запуск из cron: 30 3 * * * /srv/eva-site/deploy/rebuild.sh
set -euo pipefail

cd "$(dirname "$0")/../web"
export PB_URL="${PB_URL:-http://127.0.0.1:8090}"

npm ci --no-audit --no-fund
npm run build
echo "Сайт пересобран: $(pwd)/dist"
