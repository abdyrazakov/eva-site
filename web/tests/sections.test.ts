import { describe, it, expect } from 'vitest';
import { visibleSections } from '../src/lib/sections';
import { siteDataFixture } from './fixtures';
import type { SiteData } from '../src/lib/types';

const withContent: SiteData = {
  ...siteDataFixture,
  photos: [{ id: 'p', url: '/a.jpg', caption: '' }],
  reviews: [{ id: 'r', author: 'Айбек', text: 'супер' }],
};

describe('visibleSections', () => {
  it('gallery hidden when no photos', () => {
    expect(visibleSections({ ...withContent, photos: [] }).gallery).toBe(false);
  });
  it('reviews hidden when no reviews', () => {
    expect(visibleSections({ ...withContent, reviews: [] }).reviews).toBe(false);
  });
  it('both visible when data present', () => {
    expect(visibleSections(withContent)).toEqual({ gallery: true, reviews: true });
  });
});
