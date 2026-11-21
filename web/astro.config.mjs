// @ts-check
import { defineConfig } from 'astro/config';

// В разработке запросы к /api и админке идут на локальный PocketBase,
// как в продакшене, где их проксирует Caddy.
export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api': 'http://127.0.0.1:8090',
        '/_': 'http://127.0.0.1:8090',
      },
    },
  },
});
