import type { SiteData } from './types';

export function visibleSections(data: SiteData): { gallery: boolean; reviews: boolean } {
  return { gallery: data.photos.length > 0, reviews: data.reviews.length > 0 };
}
