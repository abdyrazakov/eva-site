import { describe, it, expect } from 'vitest';
import { interiorPrice, trunkPrice, orderTotal } from '../src/lib/pricing';
import { defaultSettings, defaultTrunkClasses } from './fixtures';

const sedan = defaultTrunkClasses[0];
const crossover = defaultTrunkClasses[1];

describe('interiorPrice', () => {
  it('interior with borders is 2200', () => {
    expect(interiorPrice(true, defaultSettings)).toBe(2200);
  });
  it('interior without borders is 1700', () => {
    expect(interiorPrice(false, defaultSettings)).toBe(1700);
  });
});

describe('trunkPrice', () => {
  it('sedan trunk (1.0 m2) costs 1300', () => {
    expect(trunkPrice(sedan, defaultSettings)).toBe(1300);
  });
  it('crossover trunk (1.3 m2) costs 1690', () => {
    expect(trunkPrice(crossover, defaultSettings)).toBe(1690);
  });
  it('trunk with area 0 returns null', () => {
    expect(trunkPrice({ ...sedan, areaM2: 0 }, defaultSettings)).toBeNull();
  });
  it('trunk price per m2 of 0 returns null', () => {
    expect(trunkPrice(sedan, { ...defaultSettings, trunkPricePerM2: 0 })).toBeNull();
  });
});

describe('orderTotal', () => {
  it('total with borders and sedan trunk is 3500, trunkApprox true', () => {
    expect(orderTotal({ borders: true, trunk: sedan }, defaultSettings)).toEqual({
      total: 3500,
      trunkApprox: true,
    });
  });
  it('total without trunk has trunkApprox false', () => {
    expect(orderTotal({ borders: false, trunk: null }, defaultSettings)).toEqual({
      total: 1700,
      trunkApprox: false,
    });
  });
  it('trunk with area 0 gives total null, not NaN', () => {
    const result = orderTotal({ borders: true, trunk: { ...sedan, areaM2: 0 } }, defaultSettings);
    expect(result.total).toBeNull();
  });
});
