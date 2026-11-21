import type { Settings, TrunkClass } from './types';

const isPositiveFinite = (n: number): boolean => Number.isFinite(n) && n > 0;

export function interiorPrice(borders: boolean, s: Settings): number {
  return borders ? s.priceInteriorBorders : s.priceInteriorPlain;
}

export function trunkPrice(t: TrunkClass, s: Settings): number | null {
  if (!isPositiveFinite(t.areaM2) || !isPositiveFinite(s.trunkPricePerM2)) return null;
  return Math.round(t.areaM2 * s.trunkPricePerM2);
}

export function orderTotal(
  o: { borders: boolean; trunk: TrunkClass | null },
  s: Settings,
): { total: number | null; trunkApprox: boolean } {
  const interior = interiorPrice(o.borders, s);
  if (!o.trunk) return { total: interior, trunkApprox: false };
  const trunk = trunkPrice(o.trunk, s);
  return { total: trunk === null ? null : interior + trunk, trunkApprox: true };
}
