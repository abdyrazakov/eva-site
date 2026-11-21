import type { Steering } from './types';

const NEUTRAL_GREY = '#999999';
const HEX = /^#[0-9a-fA-F]{6}$/;

export function isSafeHex(v: string): boolean {
  return HEX.test(v);
}

const safe = (v: string): string => (isSafeHex(v) ? v : NEUTRAL_GREY);

interface Shape {
  mat: 'driver' | 'passenger' | 'rear' | 'tunnel' | 'trunk';
  x: number;
  y: number;
  w: number;
  h: number;
}

const FRONT_LEFT_X = 24;
const FRONT_RIGHT_X = 168;
const BORDER_INSET = 9;

function shapes(steering: Steering, withTrunk: boolean): Shape[] {
  const driverX = steering === 'left' ? FRONT_LEFT_X : FRONT_RIGHT_X;
  const passengerX = steering === 'left' ? FRONT_RIGHT_X : FRONT_LEFT_X;
  const list: Shape[] = [
    { mat: 'driver', x: driverX, y: 30, w: 108, h: 170 },
    { mat: 'passenger', x: passengerX, y: 30, w: 108, h: 170 },
    { mat: 'tunnel', x: 132, y: 40, w: 36, h: 170 },
    { mat: 'rear', x: 24, y: 226, w: 252, h: 150 },
  ];
  if (withTrunk) list.push({ mat: 'trunk', x: 24, y: 396, w: 252, h: 140 });
  return list;
}

export function renderCabinSvg(opts: {
  matHex: string;
  trimHex: string;
  borders: boolean;
  withTrunk: boolean;
  steering: Steering;
}): string {
  const fill = safe(opts.matHex);
  const stroke = safe(opts.trimHex);

  const parts = shapes(opts.steering, opts.withTrunk).map((s) => {
    const mat = `<rect data-mat="${s.mat}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`;
    if (!opts.borders) return mat;
    const inner = `<rect data-border="${s.mat}" x="${s.x + BORDER_INSET}" y="${s.y + BORDER_INSET}" width="${s.w - 2 * BORDER_INSET}" height="${s.h - 2 * BORDER_INSET}" rx="8" fill="none" stroke="${stroke}" stroke-width="2" stroke-dasharray="6 4" opacity="0.7"/>`;
    return mat + inner;
  });

  const height = opts.withTrunk ? 560 : 400;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 ${height}" role="img" aria-label="Схема салона с ковриками">${parts.join('')}</svg>`;
}
