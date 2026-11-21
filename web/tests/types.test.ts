import { describe, it, expect } from 'vitest';
import { defaultColors, defaultSettings } from './fixtures';

describe('fixtures', () => {
  it('expose 11 default colors and the agreed interior price', () => {
    expect(defaultColors.length).toBe(11);
    expect(defaultSettings.priceInteriorBorders).toBe(2200);
  });
});
