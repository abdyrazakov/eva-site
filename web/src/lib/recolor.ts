import { isSafeHex } from './cabin-svg';

export type Rgb = [number, number, number];

const NEUTRAL: Rgb = [153, 153, 153];

// Пиксель коврика: синий канал заметно сильнее красного и зелёного (на базовом фото коврик синий).
const MAT_MIN_BLUE = 80;
const MAT_MIN_DOMINANCE = 25;
const MAT_FULL_DOMINANCE = 55; // с этого значения коврик красится полностью, ниже растушёвка
// Кант на базовом фото тёмный, и он лежит между ковриком и полом.
const KANT_MAX_VALUE = 70;
const HIGHLIGHT = 1.0; // насколько светлые места уходят к белому
const SHADOW = 1.4; // насколько тёмные места темнеют

export interface MatMasks {
  width: number;
  height: number;
  /** 0 — прочее (пол, заклёпки), 1 — коврик, 2 — кант */
  classes: Uint8Array;
  /** Доля перекраски коврика 0..255 (мягкий край, без цветной каймы) */
  blend: Uint8Array;
  /** Средняя яркость (синий канал) коврика на базовом фото */
  matMean: number;
  /** Наибольшая яркость канта на базовом фото */
  kantMax: number;
}

export function hexToRgb(hex: string): Rgb {
  if (!isSafeHex(hex)) return [...NEUTRAL];
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// Расширяет маску на radius пикселей (максимум в окне по строке, затем по столбцу).
function dilate(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const rows = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = Math.max(0, x - radius);
      const to = Math.min(width - 1, x + radius);
      for (let k = from; k <= to; k++) {
        if (mask[y * width + k]) {
          rows[y * width + x] = 1;
          break;
        }
      }
    }
  }
  const out = new Uint8Array(mask.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const from = Math.max(0, y - radius);
      const to = Math.min(height - 1, y + radius);
      for (let k = from; k <= to; k++) {
        if (rows[k * width + x]) {
          out[y * width + x] = 1;
          break;
        }
      }
    }
  }
  return out;
}

export function buildMasks(rgba: Uint8ClampedArray, width: number, height: number): MatMasks {
  const total = width * height;
  const isMat = new Uint8Array(total);
  const isDark = new Uint8Array(total);
  const isBackground = new Uint8Array(total);
  const blend = new Uint8Array(total);

  for (let p = 0; p < total; p++) {
    const r = rgba[p * 4];
    const g = rgba[p * 4 + 1];
    const b = rgba[p * 4 + 2];
    const dominance = b - Math.max(r, g);
    if (b >= MAT_MIN_BLUE && dominance >= MAT_MIN_DOMINANCE) {
      isMat[p] = 1;
      const w = (dominance - MAT_MIN_DOMINANCE) / (MAT_FULL_DOMINANCE - MAT_MIN_DOMINANCE);
      blend[p] = Math.round(Math.min(1, w) * 255);
    } else if (Math.max(r, g, b) < KANT_MAX_VALUE) {
      isDark[p] = 1;
    } else {
      isBackground[p] = 1;
    }
  }

  const radius = Math.max(2, Math.round(Math.min(width, height) / 100));
  const nearMat = dilate(isMat, width, height, radius);
  const nearBackground = dilate(isBackground, width, height, radius);

  const classes = new Uint8Array(total);
  let matSum = 0;
  let matCount = 0;
  let kantMax = 1;
  for (let p = 0; p < total; p++) {
    if (isMat[p]) {
      classes[p] = 1;
      if (blend[p] === 255) {
        matSum += rgba[p * 4 + 2];
        matCount += 1;
      }
    } else if (isDark[p] && nearMat[p] && nearBackground[p]) {
      classes[p] = 2;
      kantMax = Math.max(kantMax, rgba[p * 4], rgba[p * 4 + 1], rgba[p * 4 + 2]);
    }
  }
  return { width, height, classes, blend, matMean: matCount ? matSum / matCount : 1, kantMax };
}

// Светлее среднего — к белому, темнее среднего — к чёрному: фактура сохраняется для любого цвета.
function shade(target: number, ratio: number): number {
  if (ratio >= 1) return target + (255 - target) * Math.min(1, (ratio - 1) * HIGHLIGHT);
  return target * Math.max(0, 1 - (1 - ratio) * SHADOW);
}

export function recolor(
  rgba: Uint8ClampedArray,
  masks: MatMasks,
  matRgb: Rgb,
  trimRgb: Rgb,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(rgba);
  const { classes, blend, matMean, kantMax } = masks;

  for (let p = 0; p < classes.length; p++) {
    const i = p * 4;
    if (classes[p] === 1) {
      const ratio = rgba[i + 2] / matMean;
      const w = blend[p] / 255;
      for (let c = 0; c < 3; c++) {
        out[i + c] = Math.round(rgba[i + c] * (1 - w) + shade(matRgb[c], ratio) * w);
      }
    } else if (classes[p] === 2) {
      const value = Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) / kantMax;
      const factor = 0.7 + 0.3 * value;
      for (let c = 0; c < 3; c++) out[i + c] = Math.round(trimRgb[c] * factor);
    }
  }
  return out;
}
