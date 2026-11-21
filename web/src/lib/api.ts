import type { ColorUsage, SiteData } from './types';

type Rec = Record<string, unknown>;

export interface RawData {
  settings: unknown[];
  colors: unknown[];
  trunkClasses: unknown[];
  photos: unknown[];
  reviews: unknown[];
}

const IMAGE_THUMB = '600x0';

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const usage = (v: unknown): ColorUsage => (v === 'mat' || v === 'trim' ? v : 'both');

function fileUrl(base: string, r: Rec, field: string): string | undefined {
  const name = str(r[field]);
  // Миниатюры (описаны в миграции) вместо оригиналов в 5-8 МБ: страница должна грузиться быстро.
  return name
    ? `${base}/api/files/${str(r.collectionId)}/${str(r.id)}/${name}?thumb=${IMAGE_THUMB}`
    : undefined;
}

export function mapRecords(raw: RawData, fileBase: string): SiteData {
  const settings = raw.settings[0] as Rec | undefined;
  if (!settings) throw new Error('settings record is missing');

  return {
    settings: {
      shopName: str(settings.shop_name),
      whatsapp: str(settings.whatsapp),
      leadDays: num(settings.lead_days),
      priceInteriorBorders: num(settings.price_interior_borders),
      priceInteriorPlain: num(settings.price_interior_plain),
      trunkPricePerM2: num(settings.trunk_price_per_m2),
      about: str(settings.about),
      warranty: str(settings.warranty),
    },
    colors: (raw.colors as Rec[]).map((r) => ({
      id: str(r.id),
      name: str(r.name),
      hex: str(r.hex),
      usage: usage(r.usage),
    })),
    trunkClasses: (raw.trunkClasses as Rec[]).map((r) => ({
      id: str(r.id),
      name: str(r.name),
      areaM2: num(r.area_m2),
    })),
    photos: (raw.photos as Rec[]).flatMap((r) => {
      const url = fileUrl(fileBase, r, 'image');
      return url ? [{ id: str(r.id), url, caption: str(r.caption) }] : [];
    }),
    reviews: (raw.reviews as Rec[]).map((r) => ({
      id: str(r.id),
      author: str(r.author),
      text: str(r.text),
      photoUrl: fileUrl(fileBase, r, 'photo'),
    })),
  };
}

async function fetchItems(fetchFn: typeof fetch, url: string): Promise<unknown[]> {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const body = (await res.json()) as { items?: unknown };
  if (!Array.isArray(body.items)) throw new Error(`Unexpected response shape for ${url}`);
  return body.items;
}

export async function loadSiteData(
  fetchFn: typeof fetch,
  snapshot: SiteData,
  base = '',
): Promise<SiteData> {
  const list = (name: string, sorted: boolean) =>
    fetchItems(
      fetchFn,
      `${base}/api/collections/${name}/records?perPage=200${sorted ? '&sort=order' : ''}`,
    );
  try {
    const [settings, colors, trunkClasses, photos, reviews] = await Promise.all([
      list('settings', false),
      list('colors', true),
      list('trunk_classes', true),
      list('photos', true),
      list('reviews', true),
    ]);
    return mapRecords({ settings, colors, trunkClasses, photos, reviews }, base);
  } catch {
    return snapshot;
  }
}
