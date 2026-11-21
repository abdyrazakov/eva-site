import type { ColorOption, ComboPhoto, Order, SiteData, Steering } from './types';

export interface ConfigState {
  borders: boolean;
  trunkId: string | null;
  matId: string;
  trimId: string;
  car: string;
  steering: Steering | null;
}

export function colorsFor(data: SiteData, kind: 'mat' | 'trim'): ColorOption[] {
  return data.colors.filter((c) => c.usage === kind || c.usage === 'both');
}

// Настоящее фото именно для этой пары цветов (загружается владельцем в админке), если оно есть.
export function findComboPhoto(data: SiteData, matId: string, trimId: string): ComboPhoto | null {
  return data.comboPhotos.find((p) => p.matId === matId && p.trimId === trimId) ?? null;
}

// Ключ того, что реально нарисовано на превью. Пока он не изменился (например, пользователь печатает
// марку авто), фото не перерисовывается: перекраска ~730 тыс. пикселей на каждую букву тормозила бы телефон.
export function previewKey(state: ConfigState, data: SiteData, photoReady: boolean): string {
  const real = findComboPhoto(data, state.matId, state.trimId);
  if (real) return `real:${real.url}`;
  const hex = (kind: 'mat' | 'trim', id: string): string =>
    colorsFor(data, kind).find((c) => c.id === id)?.hex ?? '';
  const mat = hex('mat', state.matId);
  const trim = hex('trim', state.trimId);
  const mirrored = state.steering === 'right';
  if (photoReady) return `photo:${mat}:${trim}:${mirrored}`;
  return `svg:${mat}:${trim}:${mirrored}:${state.borders}:${state.trunkId !== null}`;
}

// Заказ возможен, только если есть и цвет коврика, и цвет канта (иначе toOrder бросит ошибку).
export function canOrder(data: SiteData): boolean {
  return colorsFor(data, 'mat').length > 0 && colorsFor(data, 'trim').length > 0;
}

const firstId =(list: ColorOption[]): string => list[0]?.id ?? '';

export function initialState(data: SiteData): ConfigState {
  const matId = firstId(colorsFor(data, 'mat'));
  const trims = colorsFor(data, 'trim');
  // Кант по умолчанию отличается от коврика, иначе его не видно на превью.
  const trimId = trims.find((c) => c.id !== matId)?.id ?? firstId(trims);
  return {
    borders: true,
    trunkId: null,
    matId,
    trimId,
    car: '',
    steering: null,
  };
}

export function reconcile(state: ConfigState, data: SiteData): ConfigState {
  const mats = colorsFor(data, 'mat');
  const trims = colorsFor(data, 'trim');
  return {
    ...state,
    matId: mats.some((c) => c.id === state.matId) ? state.matId : firstId(mats),
    trimId: trims.some((c) => c.id === state.trimId) ? state.trimId : firstId(trims),
    trunkId: data.trunkClasses.some((t) => t.id === state.trunkId) ? state.trunkId : null,
  };
}

// Вызывается только после validateOrder: к этому моменту руль выбран и цвета существуют.
export function toOrder(state: ConfigState, data: SiteData): Order {
  const matColor = colorsFor(data, 'mat').find((c) => c.id === state.matId);
  const trimColor = colorsFor(data, 'trim').find((c) => c.id === state.trimId);
  if (!matColor || !trimColor) throw new Error('No color available for the order');
  return {
    borders: state.borders,
    trunk: data.trunkClasses.find((t) => t.id === state.trunkId) ?? null,
    matColor,
    trimColor,
    car: state.car.trim(),
    steering: state.steering ?? 'left',
  };
}
