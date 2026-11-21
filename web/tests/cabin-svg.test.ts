import { describe, it, expect } from 'vitest';
import { renderCabinSvg, isSafeHex } from '../src/lib/cabin-svg';

const base = {
  matHex: '#E53935',
  trimHex: '#111111',
  borders: true,
  withTrunk: false,
  steering: 'left' as const,
};

const element = (svg: string, mat: string): string => {
  const m = svg.match(new RegExp(`<[^>]*data-mat="${mat}"[^>]*>`));
  if (!m) throw new Error(`no element for ${mat}`);
  return m[0];
};
const xOf = (el: string): number => Number(el.match(/\sx="([\d.]+)"/)![1]);

describe('isSafeHex', () => {
  it('accepts #RRGGBB and rejects everything else', () => {
    expect(isSafeHex('#E53935')).toBe(true);
    expect(isSafeHex('#e53935')).toBe(true);
    expect(isSafeHex('#fff')).toBe(false);
    expect(isSafeHex('red')).toBe(false);
    expect(isSafeHex('#E53935"onload=')).toBe(false);
  });
});

describe('renderCabinSvg', () => {
  it('all interior mats use matHex as fill and trimHex as stroke', () => {
    const svg = renderCabinSvg(base);
    for (const mat of ['driver', 'passenger', 'rear', 'tunnel']) {
      const el = element(svg, mat);
      expect(el).toContain('fill="#E53935"');
      expect(el).toContain('stroke="#111111"');
    }
  });

  it('trunk block is present only when withTrunk is true', () => {
    expect(renderCabinSvg(base)).not.toContain('data-mat="trunk"');
    const withTrunk = renderCabinSvg({ ...base, withTrunk: true });
    const el = element(withTrunk, 'trunk');
    expect(el).toContain('fill="#E53935"');
    expect(el).toContain('stroke="#111111"');
  });

  it('borders adds inner outline elements, no borders does not', () => {
    expect(renderCabinSvg(base)).toContain('data-border=');
    expect(renderCabinSvg({ ...base, borders: false })).not.toContain('data-border=');
  });

  it('right-hand drive mirrors driver mat to the right side', () => {
    const left = renderCabinSvg(base);
    const right = renderCabinSvg({ ...base, steering: 'right' });
    expect(xOf(element(left, 'driver'))).toBeLessThan(xOf(element(left, 'passenger')));
    expect(xOf(element(right, 'driver'))).toBeGreaterThan(xOf(element(right, 'passenger')));
  });

  it('invalid hex is replaced by neutral grey and never appears in output', () => {
    const svg = renderCabinSvg({ ...base, matHex: 'red;"onload=alert(1)', trimHex: '<script>' });
    expect(svg).not.toContain('onload');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('#999999');
  });
});
