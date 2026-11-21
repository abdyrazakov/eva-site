import { describe, it, expect } from 'vitest';
import {
  initialState,
  colorsFor,
  reconcile,
  toOrder,
  canOrder,
  findComboPhoto,
} from '../src/lib/configurator';
import { siteDataFixture, defaultColors } from './fixtures';
import type { SiteData } from '../src/lib/types';

describe('initialState', () => {
  it('picks first mat color and a different trim color with borders on', () => {
    const s = initialState(siteDataFixture);
    expect(s.matId).toBe(defaultColors[0].id);
    expect(s.trimId).toBe(defaultColors[1].id);
    expect(s.borders).toBe(true);
    expect(s.trunkId).toBeNull();
    expect(s.steering).toBeNull();
    expect(s.car).toBe('');
  });
});

describe('colorsFor', () => {
  it('mat excludes trim-only colors and trim excludes mat-only colors', () => {
    const data: SiteData = {
      ...siteDataFixture,
      colors: [
        { id: 'a', name: 'A', hex: '#111111', usage: 'mat' },
        { id: 'b', name: 'B', hex: '#222222', usage: 'trim' },
        { id: 'c', name: 'C', hex: '#333333', usage: 'both' },
      ],
    };
    expect(colorsFor(data, 'mat').map((c) => c.id)).toEqual(['a', 'c']);
    expect(colorsFor(data, 'trim').map((c) => c.id)).toEqual(['b', 'c']);
  });
});

describe('reconcile', () => {
  it('replaces a removed color with the first available', () => {
    const state = { ...initialState(siteDataFixture), matId: 'red', trimId: 'blue' };
    const data: SiteData = {
      ...siteDataFixture,
      colors: defaultColors.filter((c) => c.id !== 'red' && c.id !== 'blue'),
    };
    const next = reconcile(state, data);
    expect(next.matId).toBe(data.colors[0].id);
    expect(next.trimId).toBe(data.colors[0].id);
  });
  it('clears trunk if its class was removed', () => {
    const state = { ...initialState(siteDataFixture), trunkId: 'sedan' };
    const data: SiteData = { ...siteDataFixture, trunkClasses: [] };
    expect(reconcile(state, data).trunkId).toBeNull();
  });
  it('keeps valid selections untouched', () => {
    const state = { ...initialState(siteDataFixture), matId: 'green', trunkId: 'wagon' };
    expect(reconcile(state, siteDataFixture)).toEqual(state);
  });
});

describe('canOrder', () => {
  const only = (usage: 'mat' | 'trim'): SiteData => ({
    ...siteDataFixture,
    colors: [{ id: 'x', name: 'X', hex: '#111111', usage }],
  });
  it('is true when both a mat and a trim color exist', () => {
    expect(canOrder(siteDataFixture)).toBe(true);
  });
  it('is false when only trim colors exist', () => {
    expect(canOrder(only('trim'))).toBe(false);
  });
  it('is false when only mat colors exist', () => {
    expect(canOrder(only('mat'))).toBe(false);
  });
  it('is false when there are no colors', () => {
    expect(canOrder({ ...siteDataFixture, colors: [] })).toBe(false);
  });
});

describe('findComboPhoto', () => {
  const data: SiteData = {
    ...siteDataFixture,
    comboPhotos: [{ matId: 'red', trimId: 'black', url: '/real.jpg' }],
  };
  it('returns the real photo for the exact mat and trim pair', () => {
    expect(findComboPhoto(data, 'red', 'black')?.url).toBe('/real.jpg');
  });
  it('returns null for another pair', () => {
    expect(findComboPhoto(data, 'red', 'white')).toBeNull();
    expect(findComboPhoto(data, 'blue', 'black')).toBeNull();
  });
});

describe('toOrder', () => {
  it('resolves ids to objects', () => {
    const state = {
      ...initialState(siteDataFixture),
      matId: 'green',
      trimId: 'black',
      trunkId: 'crossover',
      borders: false,
      car: '  Toyota Prius 2012 ',
      steering: 'right' as const,
    };
    const order = toOrder(state, siteDataFixture);
    expect(order.matColor.name).toBe('Зелёный');
    expect(order.trimColor.name).toBe('Чёрный');
    expect(order.trunk?.name).toBe('Кроссовер');
    expect(order.borders).toBe(false);
    expect(order.car).toBe('Toyota Prius 2012');
    expect(order.steering).toBe('right');
  });
});
