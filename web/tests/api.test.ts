import { describe, it, expect } from 'vitest';
import { mapRecords, loadSiteData } from '../src/lib/api';
import { siteDataFixture } from './fixtures';

const raw = {
  settings: [
    {
      shop_name: 'Ева Тоха',
      whatsapp: '996111222333',
      lead_days: 5,
      price_interior_borders: 2300,
      price_interior_plain: 1800,
      trunk_price_per_m2: 1400,
      about: 'о нас',
      warranty: 'гарантия',
    },
  ],
  colors: [{ id: 'c1', name: 'Красный', hex: '#E53935', usage: 'both' }],
  trunkClasses: [{ id: 't1', name: 'Седан', area_m2: 1.1 }],
  photos: [{ id: 'p1', collectionId: 'colP', image: 'a.jpg', caption: 'работа' }],
  reviews: [
    { id: 'r1', collectionId: 'colR', author: 'Айбек', text: 'супер', photo: 'b.jpg' },
    { id: 'r2', collectionId: 'colR', author: 'Мээрим', text: 'хорошо', photo: '' },
  ],
  comboPhotos: [
    { id: 'cp1', collectionId: 'colC', mat: 'c1', trim: 'c2', image: 'real.jpg' },
    { id: 'cp2', collectionId: 'colC', mat: 'c1', trim: 'c3', image: '' },
  ],
};

function fakeFetch(
  opts: { fail?: 'reject' | 500; emptySettings?: boolean; missingCombo?: boolean } = {},
): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    if (opts.fail === 'reject') throw new TypeError('network down');
    if (opts.fail === 500) return new Response('boom', { status: 500 });
    const url = String(input);
    if (opts.missingCombo && url.includes('/combo_photos/')) {
      return new Response('{"message":"missing"}', { status: 404 });
    }
    const pick = (key: keyof typeof raw) => {
      const items = key === 'settings' && opts.emptySettings ? [] : raw[key];
      return new Response(JSON.stringify({ items }), { status: 200 });
    };
    if (url.includes('/colors/')) return pick('colors');
    if (url.includes('/trunk_classes/')) return pick('trunkClasses');
    if (url.includes('/photos/')) return pick('photos');
    if (url.includes('/reviews/')) return pick('reviews');
    if (url.includes('/combo_photos/')) return pick('comboPhotos');
    return pick('settings');
  }) as typeof fetch;
}

describe('mapRecords', () => {
  it('converts snake_case fields and builds file urls', () => {
    const data = mapRecords(raw, 'https://eva.example');
    expect(data.settings.shopName).toBe('Ева Тоха');
    expect(data.settings.priceInteriorBorders).toBe(2300);
    expect(data.settings.trunkPricePerM2).toBe(1400);
    expect(data.trunkClasses[0].areaM2).toBe(1.1);
    expect(data.photos[0].url).toBe('https://eva.example/api/files/colP/p1/a.jpg?thumb=600x0');
    expect(data.reviews[0].photoUrl).toBe('https://eva.example/api/files/colR/r1/b.jpg?thumb=600x0');
    expect(data.reviews[1].photoUrl).toBeUndefined();
  });

  it('maps real combo photos with a large thumb and skips records without a file', () => {
    const data = mapRecords(raw, 'https://eva.example');
    expect(data.comboPhotos).toEqual([
      {
        matId: 'c1',
        trimId: 'c2',
        url: 'https://eva.example/api/files/colC/cp1/real.jpg?thumb=1200x0',
      },
    ]);
  });
});

describe('loadSiteData', () => {
  it('returns live data when all requests succeed', async () => {
    const data = await loadSiteData(fakeFetch(), siteDataFixture);
    expect(data.settings.leadDays).toBe(5);
    expect(data.colors).toHaveLength(1);
  });
  it('keeps live data when only combo_photos is unavailable (migration not applied yet)', async () => {
    const data = await loadSiteData(fakeFetch({ missingCombo: true }), siteDataFixture);
    expect(data).not.toBe(siteDataFixture);
    expect(data.settings.leadDays).toBe(5);
    expect(data.comboPhotos).toEqual([]);
  });
  it('returns snapshot when fetch rejects', async () => {
    expect(await loadSiteData(fakeFetch({ fail: 'reject' }), siteDataFixture)).toBe(siteDataFixture);
  });
  it('returns snapshot on HTTP 500', async () => {
    expect(await loadSiteData(fakeFetch({ fail: 500 }), siteDataFixture)).toBe(siteDataFixture);
  });
  it('returns snapshot when settings list is empty', async () => {
    expect(await loadSiteData(fakeFetch({ emptySettings: true }), siteDataFixture)).toBe(
      siteDataFixture,
    );
  });
});
