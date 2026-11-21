# Ева Тоха — сайт EVA-ковриков: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сайт магазина «Ева Тоха»: конфигуратор набора и цветов (коврик + кант) с живым превью салона, заказ через WhatsApp, админка для владельца.

**Architecture:** Статический сайт на Astro с небольшим клиентским TypeScript (без UI-фреймворка). Данные в PocketBase (SQLite + готовая админка `/_/`). Страница при загрузке берёт данные из `/api/...` того же домена; если сервер недоступен, использует снимок, встроенный в сборку. Чистая логика (цены, сообщение WhatsApp, SVG) вынесена в `web/src/lib` и покрыта тестами.

**Tech Stack:** Astro, TypeScript, Vitest, PocketBase (latest 0.x stable), Caddy, systemd. Репозиторий: `/home/abdyrazakov/Projects/eva-site`.

**Spec:** `docs/superpowers/specs/2026-11-21-eva-site-design.md`

## Global Constraints

- Название магазина: **Ева Тоха**. Язык интерфейса: русский. Валюта: сом.
- Цена набора салона БЕЗ багажника: с бортами **2200**, без бортов **1700**. Кант на цену не влияет.
- Багажник: **1300 сом за м²**; цена = `Math.round(areaM2 * pricePerM2)`. Классы по умолчанию: седан 1.0, кроссовер 1.3, универсал 1.6, минивэн 1.8 м². Итог с багажником на сайте — ориентировочный (размер подтверждается в WhatsApp).
- Цветов по умолчанию 11: красный, оранжевый, жёлтый, зелёный, голубой, синий, фиолетовый, чёрный, серый, белый, розовый. Все значения (цвета, цены, площади, номер, срок) хранятся в PocketBase, а не в коде.
- Заявка: поле «марка, модель, год» обязательное (1–120 символов после trim); руль (левый/правый) обязателен.
- Продаём только наборы салона (+ багажник по выбору). Отдельных ковриков, корзины, онлайн-оплаты нет.
- Mobile-first. Вес JS страницы не более 50 КБ gzip.
- Любое значение из БД, попадающее в SVG, HTML или ссылку, экранируется/валидируется.
- Коммиты: conventional (`feat:`, `test:`, `chore:`); сообщение заканчивается строкой `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Покрытие тестами `web/src/lib`: не менее 80%.

## Review Focus

1. PocketBase недоступен или вернул ошибку → сайт показывает встроенный снимок, а не пустую страницу (Task 5).
2. Номер WhatsApp в админке введён как `+996 (555) 12-34-56` → ссылка `wa.me` содержит только цифры (Task 3).
3. В поле «авто» есть `&`, `#`, перенос строки, эмодзи, кавычки → ссылка и сообщение не ломаются (Task 3).
4. Цвет в БД с невалидным hex (`red;"onload=`) → превью не ломается и не исполняет код (Task 6).
5. Класс багажника с площадью 0 или пустая цена за м² → итог не `NaN`, показывается «цену уточним в WhatsApp» (Task 2).

Дополнительно: пустые галерея/отзывы скрывают свои разделы (Task 8); цвет, отключённый в админке, не остаётся выбранным (Task 7).

---

## File Structure

```
eva-site/
  backend/                      # PocketBase
    pb_migrations/              # схема коллекций + начальные данные
    .gitignore                  # бинарник pocketbase и pb_data
  web/                          # Astro
    src/lib/types.ts            # общие типы
    src/lib/pricing.ts          # цены
    src/lib/whatsapp.ts         # валидация заявки, сообщения, ссылки
    src/lib/api.ts              # загрузка данных + снимок
    src/lib/cabin-svg.ts        # SVG-превью салона
    src/lib/configurator.ts     # состояние выбора (чистая логика)
    src/lib/sections.ts         # видимость разделов
    src/components/*.astro      # разделы страницы
    src/scripts/app.ts          # связка DOM с lib
    src/pages/index.astro
    scripts/snapshot.mjs        # сохраняет снимок данных перед сборкой
    tests/*.test.ts
  deploy/                       # Caddyfile, systemd unit, backup.sh, rebuild.sh
  README.md                     # запуск и инструкция владельцу
```

---

### Task 1: Каркас проекта, git, тестовая среда

**Files:**
- Create: `web/` (Astro minimal template, TypeScript strict), `web/vitest.config.ts`, `web/src/lib/types.ts`, `web/tests/fixtures.ts`, `.gitignore`
- Test: `web/tests/types.test.ts`

**Interfaces:**
- Produces (`web/src/lib/types.ts`), все остальные задачи импортируют отсюда:
  - `type ColorUsage = 'mat' | 'trim' | 'both'`
  - `interface ColorOption { id: string; name: string; hex: string; usage: ColorUsage }`
  - `interface TrunkClass { id: string; name: string; areaM2: number }`
  - `interface Settings { shopName: string; whatsapp: string; leadDays: number; priceInteriorBorders: number; priceInteriorPlain: number; trunkPricePerM2: number; about: string; warranty: string }`
  - `interface Photo { id: string; url: string; caption: string }`
  - `interface Review { id: string; author: string; text: string; photoUrl?: string }`
  - `interface SiteData { settings: Settings; colors: ColorOption[]; trunkClasses: TrunkClass[]; photos: Photo[]; reviews: Review[] }`
  - `type Steering = 'left' | 'right'`
  - `interface Order { borders: boolean; trunk: TrunkClass | null; matColor: ColorOption; trimColor: ColorOption; car: string; steering: Steering }`
- Produces (`web/tests/fixtures.ts`): `defaultSettings`, `defaultColors` (11 цветов из Global Constraints, `usage: 'both'`), `defaultTrunkClasses`, `siteDataFixture`.

- [ ] **Step 1:** `git init` в корне проекта, создать `.gitignore` (node_modules, dist, `backend/pocketbase`, `backend/pb_data`). Закоммитить существующий `docs/` как `docs: add design spec and plan`.
- [ ] **Step 2:** Создать Astro-проект в `web/` (минимальный шаблон, strict TypeScript), добавить Vitest с покрытием (v8). Скрипты: `test`, `test:coverage`, `build`.
- [ ] **Step 3:** Написать `types.ts` и `fixtures.ts`. Тест `types.test.ts`: `it('fixtures expose 11 default colors and the agreed interior price')` проверяет `defaultColors.length === 11` и `defaultSettings.priceInteriorBorders === 2200`.
- [ ] **Step 4:** Run: `cd web && npm test` → PASS. Run: `npm run build` → успешно.
- [ ] **Step 5:** Commit `chore: scaffold astro app with vitest and shared types`.

---

### Task 2: Расчёт цены (`pricing.ts`)

**Files:**
- Create: `web/src/lib/pricing.ts`
- Test: `web/tests/pricing.test.ts`

**Interfaces:**
- Consumes: `Settings`, `TrunkClass`, фикстуры из Task 1.
- Produces:
  - `interiorPrice(borders: boolean, s: Settings): number`
  - `trunkPrice(t: TrunkClass, s: Settings): number | null` — `null`, если `areaM2` или `trunkPricePerM2` не конечное положительное число
  - `orderTotal(o: { borders: boolean; trunk: TrunkClass | null }, s: Settings): { total: number | null; trunkApprox: boolean }` — `total: null`, если багажник выбран, но его цена `null`

- [ ] **Step 1: Failing tests** (имена и проверки):
  - `interior with borders is 2200` и `interior without borders is 1700`
  - `sedan trunk (1.0 m2) costs 1300`, `crossover trunk (1.3 m2) costs 1690`
  - `total with borders and sedan trunk is 3500, trunkApprox true`
  - `total without trunk has trunkApprox false`
  - `trunk with area 0 returns null price and total null` (Review Focus 5)
  - `trunk price per m2 of 0 returns null`
- [ ] **Step 2:** Run `npx vitest run tests/pricing.test.ts` → FAIL.
- [ ] **Step 3:** Implement по сигнатурам выше.
- [ ] **Step 4:** Run тот же тест → PASS.
- [ ] **Step 5:** Commit `feat: pricing for interior sets and trunk`.

---

### Task 3: Заявка и ссылки WhatsApp (`whatsapp.ts`)

**Files:**
- Create: `web/src/lib/whatsapp.ts`
- Test: `web/tests/whatsapp.test.ts`

**Interfaces:**
- Consumes: `Order`, `Settings`, `orderTotal` из Task 2.
- Produces:
  - `sanitizePhone(raw: string): string` — только цифры
  - `validateOrder(o: { car: string; steering: Steering | null }): { ok: true } | { ok: false; errors: { car?: string; steering?: string } }`
  - `buildOrderMessage(o: Order, s: Settings): string`
  - `buildSampleMessage(s: Settings): string`
  - `buildWaLink(phone: string, message: string): string` → `https://wa.me/<digits>?text=<encodeURIComponent(message)>`

- [ ] **Step 1: Failing tests:**
  - `sanitizePhone strips plus, spaces, brackets and dashes` (`'+996 (555) 12-34-56'` → `'996555123456'`)
  - `validateOrder rejects empty or whitespace car`, `rejects car longer than 120 chars`, `rejects missing steering`, `accepts valid`
  - `buildOrderMessage contains set, mat color, trim color, car, steering, total, lead days` (для заказа «с бортами, багажник седан, красный коврик, чёрный кант» итого `3500 сом`, срок из `leadDays`)
  - `buildOrderMessage says trunk is approximate` когда багажник выбран; `says price will be confirmed` когда `total` null
  - `buildWaLink encodes ampersand, hash, newline, emoji and quotes` — `decodeURIComponent` значения параметра `text` возвращает исходное сообщение (Review Focus 3)
  - `buildSampleMessage mentions the shop name`
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Текст сообщения на русском, строки: приветствие с названием магазина, «Набор», «Цвет коврика», «Цвет канта», «Авто», «Руль», «Итого», «Срок изготовления».
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: whatsapp order message, validation and link builder`.

---

### Task 4: Бэкенд PocketBase: схема, права, начальные данные

**Files:**
- Create: `backend/pb_migrations/` (миграция схемы, миграция начальных данных), `backend/README.md` (как скачать бинарник и запустить)

**Interfaces:**
- Produces коллекции (имена и поля, на которые опирается Task 5):
  - `colors`: `name` text, `hex` text, `usage` select(`mat|trim|both`), `order` number, `active` bool
  - `trunk_classes`: `name` text, `area_m2` number, `order` number
  - `photos`: `image` file, `caption` text, `order` number
  - `reviews`: `author` text, `text` text, `photo` file (необязательно), `visible` bool, `order` number
  - `settings`: ровно одна запись: `shop_name`, `whatsapp`, `lead_days` number, `price_interior_borders` number, `price_interior_plain` number, `trunk_price_per_m2` number, `about` text, `warranty` text
- Права: list/view публичные; create/update/delete только админ. Для `colors` и `reviews` публично видны только записи с `active = true` / `visible = true` (правило list/view с фильтром).

- [ ] **Step 1:** Скачать актуальный стабильный PocketBase (linux amd64) в `backend/`, проверить синтаксис JS-миграций в его документации (через Context7 или официальную документацию, API миграций зависит от версии).
- [ ] **Step 2:** Написать миграцию схемы и миграцию данных: 11 цветов (hex: красный `#E53935`, оранжевый `#FB8C00`, жёлтый `#FDD835`, зелёный `#43A047`, голубой `#29B6F6`, синий `#1E4FD8`, фиолетовый `#8E24AA`, чёрный `#111111`, серый `#8D8D8D`, белый `#F5F5F5`, розовый `#EC407A`), 4 класса багажника (площади из Global Constraints), настройки (`shop_name` «Ева Тоха», цены 2200/1700/1300, `lead_days` 3, `whatsapp` заглушка `996000000000`, тексты-заглушки).
- [ ] **Step 3:** Run: `cd backend && ./pocketbase serve`; суперпользователя создать командой `./pocketbase superuser create`.
- [ ] **Step 4: Verify:** `curl -s localhost:8090/api/collections/colors/records` возвращает 11 записей; `curl -s localhost:8090/api/collections/settings/records` возвращает 1; `curl -s -X POST localhost:8090/api/collections/colors/records -d name=x` без авторизации → `403`. Скрытый отзыв (`visible=false`) не виден анонимно.
- [ ] **Step 5:** Commit `feat: pocketbase schema, access rules and seed data`.

---

### Task 5: Загрузка данных со снимком (`api.ts`)

**Files:**
- Create: `web/src/lib/api.ts`, `web/scripts/snapshot.mjs`, `web/src/data/snapshot.json` (генерируется, коммитится)
- Test: `web/tests/api.test.ts`

**Interfaces:**
- Consumes: типы Task 1; схема Task 4.
- Produces:
  - `mapRecords(raw: { settings: unknown[]; colors: unknown[]; trunkClasses: unknown[]; photos: unknown[]; reviews: unknown[] }, fileBase: string): SiteData` — переводит snake_case записи PocketBase в типы; URL файла `${fileBase}/api/files/<collectionId>/<id>/<file>`
  - `loadSiteData(fetchFn: typeof fetch, snapshot: SiteData, base?: string): Promise<SiteData>` — запрашивает пять коллекций (сортировка по `order`); при любой ошибке сети, не-2xx или неожиданной форме ответа возвращает `snapshot`
- `snapshot.mjs`: тянет данные с `PB_URL` (по умолчанию `http://localhost:8090`), пишет `src/data/snapshot.json`; запускается перед `build` (`prebuild`). Если PocketBase недоступен, оставляет существующий снимок и пишет предупреждение, сборка не падает.

- [ ] **Step 1: Failing tests:**
  - `mapRecords converts snake_case fields and builds file urls`
  - `loadSiteData returns live data when all requests succeed`
  - `loadSiteData returns snapshot when fetch rejects` (Review Focus 1)
  - `loadSiteData returns snapshot on HTTP 500`
  - `loadSiteData returns snapshot when settings list is empty`
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `mapRecords`, `loadSiteData`, `snapshot.mjs`; добавить `"prebuild": "node scripts/snapshot.mjs"`.
- [ ] **Step 4:** Run тесты → PASS. Run: `npm run prebuild` при запущенном PocketBase создаёт `snapshot.json` с 11 цветами.
- [ ] **Step 5:** Commit `feat: site data loader with build-time snapshot fallback`.

---

### Task 6: SVG-превью салона (`cabin-svg.ts`)

**Files:**
- Create: `web/src/lib/cabin-svg.ts`
- Test: `web/tests/cabin-svg.test.ts`

**Interfaces:**
- Produces:
  - `isSafeHex(v: string): boolean` — `/^#[0-9a-fA-F]{6}$/`
  - `renderCabinSvg(opts: { matHex: string; trimHex: string; borders: boolean; withTrunk: boolean; steering: Steering }): string` — SVG-строка вида сверху: коврик водителя, переднего пассажира, задний ряд, перемычка; багажник отдельным блоком при `withTrunk`; у каждого коврика `fill` = `matHex` и `stroke` = `trimHex`; при `borders` внутренний контур бортика. При `steering: 'right'` зеркалит передний ряд (водитель справа). Невалидный hex заменяется нейтральным серым `#999999`.

- [ ] **Step 1: Failing tests:**
  - `all interior mats use matHex as fill and trimHex as stroke`
  - `trunk block is present only when withTrunk is true`
  - `borders adds inner outline elements, no borders does not`
  - `right-hand drive mirrors driver mat to the right side`
  - `invalid hex (e.g. 'red;"onload=') is replaced by neutral grey and never appears in output` (Review Focus 4)
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Точные контуры исполнитель рисует сам (viewBox, пропорции), привязывая каждый коврик к `data-mat="driver|passenger|rear|tunnel|trunk"` для тестов.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: cabin svg preview renderer`.

---

### Task 7: Конфигуратор: состояние и страница

**Files:**
- Create: `web/src/lib/configurator.ts`, `web/src/scripts/app.ts`, `web/src/components/Configurator.astro`
- Modify: `web/src/pages/index.astro`
- Test: `web/tests/configurator.test.ts`

**Interfaces:**
- Consumes: `renderCabinSvg` (Task 6), `orderTotal` (Task 2), `validateOrder`/`buildOrderMessage`/`buildWaLink` (Task 3), `loadSiteData` (Task 5).
- Produces (`configurator.ts`, чистая логика без DOM):
  - `interface ConfigState { borders: boolean; trunkId: string | null; matId: string; trimId: string; car: string; steering: Steering | null }`
  - `initialState(data: SiteData): ConfigState` — первый цвет коврика/канта, `borders: true`, без багажника
  - `reconcile(state: ConfigState, data: SiteData): ConfigState` — если выбранный цвет или класс багажника исчез из `data`, подставляет первый доступный цвет / сбрасывает багажник
  - `colorsFor(data: SiteData, kind: 'mat' | 'trim'): ColorOption[]` — цвета с `usage` равным `kind` или `both`
  - `toOrder(state: ConfigState, data: SiteData): Order`

- [ ] **Step 1: Failing tests:** `initialState picks first mat and trim colors with borders on`; `colorsFor mat excludes trim-only colors`; `reconcile replaces a removed color with the first available`; `reconcile clears trunk if its class was removed`; `toOrder resolves ids to objects`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `configurator.ts`. Затем страница: блок выбора (борты да/нет; багажник: нет или класс, цена пересчитывается при выборе; ряды цветов для коврика и канта; поле авто; выбор руля), превью SVG, цена, срок изготовления, кнопка «Заказать в WhatsApp» (ссылка собирается при клике; при ошибке валидации показывает сообщения у полей и не открывает WhatsApp). `app.ts` подключает DOM к lib, при загрузке вызывает `loadSiteData` со встроенным `snapshot.json`.
- [ ] **Step 4:** Run тесты → PASS. Вручную в браузере (ширина 390px): смена цвета коврика и канта перекрашивает превью; цена: с бортами 2200, без бортов 1700, +1300 при багажнике «седан»; пустое поле авто блокирует отправку; кнопка открывает `wa.me/...` с сообщением.
- [ ] **Step 5:** Commit `feat: configurator page with live preview and whatsapp order`.

---

### Task 8: Разделы доверия и образцы

**Files:**
- Create: `web/src/lib/sections.ts`, `web/src/components/Gallery.astro`, `Reviews.astro`, `Process.astro`, `Samples.astro`, `About.astro`
- Modify: `web/src/pages/index.astro`
- Test: `web/tests/sections.test.ts`

**Interfaces:**
- Consumes: `SiteData`, `buildSampleMessage`, `buildWaLink`.
- Produces: `visibleSections(data: SiteData): { gallery: boolean; reviews: boolean }` — `true`, только если в данных есть хотя бы одна запись.

- [ ] **Step 1: Failing tests:** `gallery hidden when no photos`, `reviews hidden when no reviews`, `both visible when data present`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `sections.ts` и компоненты: галерея работ из цеха (ленивая загрузка изображений), отзывы (автор, текст, фото), «Как мы делаем» (резка, пошив канта, срок из настроек), блок гарантии/«О цехе» из настроек, кнопка «Заказать образцы цветов» → `wa.me` с `buildSampleMessage`. Текст из админки выводится как обычный текст (без `set:html`).
- [ ] **Step 4:** Run → PASS. Вручную: в админке скрыть все отзывы, обновить страницу, раздел отзывов пропал.
- [ ] **Step 5:** Commit `feat: gallery, reviews, process and sample request sections`.

---

### Task 9: Развёртывание, бюджет веса, инструкция владельцу

**Files:**
- Create: `deploy/Caddyfile`, `deploy/pocketbase.service`, `deploy/backup.sh`, `deploy/rebuild.sh`, `README.md`

**Interfaces:**
- Consumes: всё выше.
- Produces: рабочее развёртывание на VPS владельца.

- [ ] **Step 1:** `Caddyfile`: статические файлы из `web/dist`, `handle /api/*` и `handle /_/*` → `reverse_proxy localhost:8090`, HTTPS автоматически, домен через переменную окружения `SITE_DOMAIN`.
- [ ] **Step 2:** `pocketbase.service` (systemd, перезапуск при падении), `backup.sh` (копия `pb_data` с датой, хранить 14 последних), `rebuild.sh` (запускает `npm run build` с обновлением снимка; подключается к cron раз в сутки).
- [ ] **Step 3:** `README.md` на русском: как запустить локально; как зайти в админку `/_/`; пошаговая инструкция для владельца: поменять цену, добавить цвет, отключить цвет, загрузить фото, скрыть отзыв, поменять номер WhatsApp и срок, задать площадь класса багажника.
- [ ] **Step 4:** Verify: `cd web && npm run build` успешен; суммарный JS в `dist` не более 50 КБ gzip (`find dist -name '*.js' -exec cat {} + | gzip -c | wc -c`); `npm run test:coverage` → `src/lib` не менее 80%.
- [ ] **Step 5:** Commit `chore: deployment config and owner guide`.
- [ ] **Step 6 (финал):** Run: `npm test` целиком и ручной проход оформления заказа на реальном телефоне или эмуляции 390px от выбора до открытия WhatsApp.

---

## Self-Review

- **Покрытие проекта:** выбор набора и цены (Task 2, 7), превью с двумя цветами (6, 7), заказ в WhatsApp (3, 7), галерея/отзывы/процесс (8), образцы (3, 8), админка и данные (4), mobile-first и вес JS (7, 9), развёртывание (9).
- **Допущения плана:** «пакеты» из проекта реализованы как набор салона (с бортами / без) плюс багажник по классу, потому что владелец задал цены именно так. Снимок данных обновляется при сборке (cron раз в сутки); живые данные подтягиваются на клиенте при каждой загрузке.
- **Согласованность типов:** `SiteData`, `Order`, `Settings`, `TrunkClass`, `ColorOption` определены в Task 1 и используются в Task 2–8 без переименований.
