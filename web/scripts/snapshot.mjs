// Сохраняет снимок данных из PocketBase в src/data/snapshot.json (запасной вариант для сайта).
// Если PocketBase недоступен, оставляет прежний снимок и не роняет сборку.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteData } from '../src/lib/api.ts';

const PB_URL = process.env.PB_URL ?? 'http://127.0.0.1:8090';
const target = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/snapshot.json');

// Запросы идут на PB_URL, а ссылки на файлы остаются относительными (их отдаёт тот же домен).
const fetchFromPocketBase = (path) => fetch(`${PB_URL}${path}`);
const UNAVAILABLE = Symbol('unavailable');

const data = await loadSiteData(fetchFromPocketBase, UNAVAILABLE, '');

if (data === UNAVAILABLE) {
  console.warn(`[snapshot] PocketBase недоступен (${PB_URL}), оставляю прежний снимок`);
} else {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`[snapshot] сохранено: ${data.colors.length} цветов, ${data.trunkClasses.length} классов багажника`);
}
