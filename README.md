# Ева Тоха — сайт EVA-ковриков

Конфигуратор набора и цветов (коврик + кант) с живым превью салона. Заказ уходит в WhatsApp.
Проект и план: `docs/superpowers/specs/` и `docs/superpowers/plans/`.

```
backend/   PocketBase: база данных и админка (см. backend/README.md)
web/       сайт на Astro
deploy/    Caddy, systemd, резервные копии, пересборка
```

## Запуск локально

```bash
# 1. Бэкенд (первый запуск: скачайте бинарник, см. backend/README.md)
cd backend
./pocketbase superuser upsert you@example.com 'надёжный-пароль'
./pocketbase serve --http=127.0.0.1:8090

# 2. Сайт (в другом терминале)
cd web
npm install
npm run dev          # http://127.0.0.1:4321, запросы /api идут на PocketBase
npm test             # тесты
npm run test:coverage
```

## Инструкция для владельца

Админка: `https://ваш-домен/_/` (вход по почте и паролю суперпользователя).
Изменения видны на сайте сразу после сохранения, сайт перезапускать не нужно.

| Что сделать | Где |
|---|---|
| Поменять цену набора | `settings` → `price_interior_borders` (с бортами), `price_interior_plain` (без бортов) |
| Поменять цену багажника за м² | `settings` → `trunk_price_per_m2` |
| Задать площадь багажника для класса | `trunk_classes` → поле `area_m2` (цена = площадь × цена за м²) |
| Добавить цвет | `colors` → New record: название, цвет в формате `#RRGGBB`, `usage` (коврик/кант/оба), `active` включить |
| Убрать цвет | `colors` → снять галочку `active` |
| Загрузить фото работ | `photos` → New record, загрузить файл (jpg, png, webp до 8 МБ) |
| Показать настоящее фото для сочетания цветов | `combo_photos` → New record: выберите цвет коврика (`mat`), цвет канта (`trim`) и загрузите фото (до 10 МБ). Когда покупатель выберет именно эту пару, сайт покажет ваше фото вместо цифровой перекраски. На пару одно фото |
| Добавить или скрыть отзыв | `reviews` → New record; чтобы скрыть, снимите `visible` |
| Поменять номер WhatsApp | `settings` → `whatsapp` (можно с плюсом и пробелами, сайт возьмёт только цифры) |
| Поменять срок изготовления | `settings` → `lead_days` |
| Поменять тексты «О цехе» и гарантии | `settings` → `about`, `warranty` |

Порядок цветов, классов багажника, фото и отзывов задаёт поле `order` (меньше число — выше).

### Превью ковриков

Превью — это базовое фото `web/public/mats/base.webp`, которое сайт перекрашивает под выбранные цвета
(коврик синий, кант чёрный, пол светлый нейтральный). Подробности в
`docs/superpowers/specs/2026-11-22-photo-preview-design.md`.

Чтобы улучшить качество, замените файл на своё фото (комплект ковриков сверху на светлом нейтральном
полу, синий цвет с чёрным кантом, от 1200 px по высоте, формат WebP или любой, который поддерживает браузер;
положите его под тем же именем `base.webp`) и пересоберите сайт: `./deploy/rebuild.sh`.
Если у фото другая форма ковриков, сайт покажет её, цвета перекрасятся так же.

## Развёртывание на Render (проще всего)

Один сервис: PocketBase сам отдаёт и API с админкой, и готовый сайт. HTTPS и адрес `*.onrender.com`
выдаёт Render. Нужен платный тариф Starter (около 7 долларов в месяц) и диск 1 ГБ (0,25 доллара за ГБ):
на бесплатном тарифе база и фото стираются при каждом перезапуске.

1. Загрузите проект в репозиторий на GitHub (содержит `Dockerfile` и `render.yaml`).
2. В панели Render: New → Blueprint → выберите репозиторий. Render прочитает `render.yaml`.
3. Введите `PB_ADMIN_EMAIL` и `PB_ADMIN_PASSWORD` (надёжный пароль). Это вход в админку `/_/`.
   При каждом запуске сервис устанавливает этот пароль заново, поэтому менять пароль нужно в переменных Render.
4. Дождитесь сборки (несколько минут), откройте адрес сервиса. Админка: `адрес/_/`.
5. В админке замените номер WhatsApp (`settings` → `whatsapp`) и загрузите фото.
6. Свой домен: Settings → Custom Domains в панели Render.

Проверка образа локально: `docker build -t eva-toha .` и
`docker run -p 8090:10000 -v eva-data:/data -e PB_ADMIN_EMAIL=you@example.com -e PB_ADMIN_PASSWORD=пароль eva-toha`.

## Развёртывание на VPS

Нужны: Node.js 22+, Caddy, sqlite3, пользователь `eva`, проект в `/srv/eva-site`.

```bash
# бэкенд: бинарник PocketBase в /srv/eva-site/backend (см. backend/README.md)
sudo cp deploy/pocketbase.service /etc/systemd/system/
sudo systemctl enable --now pocketbase
cd /srv/eva-site/backend && sudo -u eva ./pocketbase superuser upsert you@example.com 'пароль'

# сайт
./deploy/rebuild.sh                 # собирает /srv/eva-site/web/dist

# Caddy: домен берётся из переменной окружения
echo 'SITE_DOMAIN=evatoha.example' | sudo tee -a /etc/environment
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy

# cron (crontab -e): резервная копия и пересборка раз в сутки
15 3 * * * /srv/eva-site/deploy/backup.sh
30 3 * * * /srv/eva-site/deploy/rebuild.sh
```

Сайт получает данные из PocketBase при каждой загрузке страницы. Если PocketBase недоступен,
показываются данные из снимка, сохранённого при последней сборке (`web/src/data/snapshot.json`).
