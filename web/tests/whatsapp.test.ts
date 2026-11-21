import { describe, it, expect } from 'vitest';
import {
  sanitizePhone,
  validateOrder,
  buildOrderMessage,
  buildSampleMessage,
  buildWaLink,
} from '../src/lib/whatsapp';
import { defaultSettings, defaultColors, defaultTrunkClasses } from './fixtures';
import type { Order } from '../src/lib/types';

const order: Order = {
  borders: true,
  trunk: defaultTrunkClasses[0],
  matColor: defaultColors[0],
  trimColor: defaultColors[7],
  car: 'Toyota Camry 2015',
  steering: 'left',
};

describe('sanitizePhone', () => {
  it('strips plus, spaces, brackets and dashes', () => {
    expect(sanitizePhone('+996 (555) 12-34-56')).toBe('996555123456');
  });
});

describe('validateOrder', () => {
  it('rejects empty or whitespace car', () => {
    const r = validateOrder({ car: '   ', steering: 'left' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.car).toBeTruthy();
  });
  it('rejects car longer than 120 chars', () => {
    expect(validateOrder({ car: 'x'.repeat(121), steering: 'left' }).ok).toBe(false);
  });
  it('rejects missing steering', () => {
    const r = validateOrder({ car: 'Honda Fit 2012', steering: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.steering).toBeTruthy();
  });
  it('accepts valid', () => {
    expect(validateOrder({ car: 'Honda Fit 2012', steering: 'right' })).toEqual({ ok: true });
  });
});

describe('buildOrderMessage', () => {
  it('contains set, colors, car, steering, total and lead days', () => {
    const m = buildOrderMessage(order, defaultSettings);
    expect(m).toContain('Ева Тоха');
    expect(m).toContain('с бортами');
    expect(m).toContain('багажник');
    expect(m).toContain('Красный');
    expect(m).toContain('Чёрный');
    expect(m).toContain('Toyota Camry 2015');
    expect(m).toContain('левый');
    expect(m).toContain('3500 сом');
    expect(m).toContain('Срок изготовления: 3');
  });
  it('says trunk is approximate when trunk is chosen', () => {
    expect(buildOrderMessage(order, defaultSettings)).toContain('ориентировочно');
  });
  it('says price will be confirmed when total is unknown', () => {
    const broken = { ...order, trunk: { ...defaultTrunkClasses[0], areaM2: 0 } };
    const m = buildOrderMessage(broken, defaultSettings);
    expect(m).toContain('уточним');
    expect(m).not.toContain('NaN');
  });
  it('mentions plain set without trunk', () => {
    const m = buildOrderMessage({ ...order, borders: false, trunk: null }, defaultSettings);
    expect(m).toContain('без бортов');
    expect(m).toContain('1700 сом');
    expect(m).not.toContain('ориентировочно');
  });
});

describe('buildWaLink', () => {
  it('encodes ampersand, hash, newline, emoji and quotes losslessly', () => {
    const msg = 'Авто: Lexus & "RX" #1\nруль 🚗';
    const link = buildWaLink('+996 (555) 12-34-56', msg);
    expect(link.startsWith('https://wa.me/996555123456?text=')).toBe(true);
    expect(new URL(link).searchParams.get('text')).toBe(msg);
  });
});

describe('buildSampleMessage', () => {
  it('mentions the shop name', () => {
    expect(buildSampleMessage(defaultSettings)).toContain('Ева Тоха');
  });
});
