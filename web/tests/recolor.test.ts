import { describe, it, expect } from 'vitest';
import { buildMasks, hexToRgb, recolor } from '../src/lib/recolor';

const W = 40;
const H = 40;
const FLOOR: [number, number, number] = [160, 158, 150];
const KANT: [number, number, number] = [15, 15, 20];
const HOLE: [number, number, number] = [10, 10, 15];

// Фон, квадрат коврика 10..29 (синий, яркость зависит от колонки), кант в 2 пикселя вокруг,
// тёмная «заклёпка» в центре коврика.
function makeImage(): Uint8ClampedArray {
  const data = new Uint8ClampedArray(W * H * 4);
  const put = (x: number, y: number, c: [number, number, number]) => {
    const i = (y * W + x) * 4;
    data[i] = c[0];
    data[i + 1] = c[1];
    data[i + 2] = c[2];
    data[i + 3] = 255;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, FLOOR);
  for (let y = 8; y < 32; y++) {
    for (let x = 8; x < 32; x++) {
      const inMat = x >= 10 && x < 30 && y >= 10 && y < 30;
      if (!inMat) put(x, y, KANT);
    }
  }
  for (let y = 10; y < 30; y++) {
    for (let x = 10; x < 30; x++) {
      // левая половина темнее (B=150), правая светлее (B=250)
      put(x, y, x < 20 ? [30, 50, 150] : [70, 100, 250]);
    }
  }
  for (let y = 19; y < 23; y++) for (let x = 19; x < 23; x++) put(x, y, HOLE);
  return data;
}

const px = (d: Uint8ClampedArray, x: number, y: number): number[] => {
  const i = (y * W + x) * 4;
  return [d[i], d[i + 1], d[i + 2]];
};
const luma = (c: number[]): number => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

describe('hexToRgb', () => {
  it('parses #RRGGBB', () => {
    expect(hexToRgb('#E53935')).toEqual([229, 57, 53]);
  });
  it('falls back to neutral grey for invalid input', () => {
    expect(hexToRgb('red;"onload=')).toEqual([153, 153, 153]);
  });
});

describe('buildMasks', () => {
  const masks = buildMasks(makeImage(), W, H);
  it('marks mat, kant and leaves floor and rivet alone', () => {
    expect(masks.classes[15 * W + 15]).toBe(1); // коврик
    expect(masks.classes[15 * W + 25]).toBe(1);
    expect(masks.classes[8 * W + 20]).toBe(2); // кант сверху
    expect(masks.classes[20 * W + 9]).toBe(2); // кант слева
    expect(masks.classes[2 * W + 2]).toBe(0); // пол
    expect(masks.classes[20 * W + 20]).toBe(0); // заклёпка внутри коврика
  });
});

describe('recolor', () => {
  const src = makeImage();
  const masks = buildMasks(src, W, H);
  const RED: [number, number, number] = [229, 57, 53];

  it('paints mat pixels with the target hue and keeps brightness variation', () => {
    const out = recolor(src, masks, RED, KANT);
    const dark = px(out, 12, 15);
    const light = px(out, 27, 15);
    expect(dark[0]).toBeGreaterThan(dark[1] * 2);
    expect(light[0]).toBeGreaterThan(light[2] * 2);
    expect(luma(light)).toBeGreaterThan(luma(dark) + 5);
  });

  it('keeps texture visible for black and white targets', () => {
    for (const hex of ['#111111', '#F5F5F5']) {
      const out = recolor(src, masks, hexToRgb(hex), KANT);
      expect(luma(px(out, 27, 15)) - luma(px(out, 12, 15))).toBeGreaterThanOrEqual(5);
    }
  });

  it('paints the kant with the trim color', () => {
    const out = recolor(src, masks, RED, [255, 255, 255]);
    expect(luma(px(out, 20, 8))).toBeGreaterThan(150);
    const outBlack = recolor(src, masks, RED, [17, 17, 17]);
    expect(luma(px(outBlack, 20, 8))).toBeLessThan(40);
  });

  it('leaves floor and rivet pixels byte-for-byte unchanged', () => {
    const out = recolor(src, masks, RED, [255, 255, 255]);
    expect(px(out, 2, 2)).toEqual([...FLOOR]);
    expect(px(out, 20, 20)).toEqual([...HOLE]);
  });

  it('does not mutate the source and returns a new array', () => {
    const copy = new Uint8ClampedArray(src);
    const out = recolor(src, masks, RED, [255, 255, 255]);
    expect(out).not.toBe(src);
    expect(src).toEqual(copy);
  });
});
