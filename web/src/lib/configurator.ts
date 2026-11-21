import type { ColorOption, Order, SiteData, Steering } from './types';

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

const firstId = (list: ColorOption[]): string => list[0]?.id ?? '';

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
