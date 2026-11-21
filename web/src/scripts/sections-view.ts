import { visibleSections } from '../lib/sections';
import type { SiteData } from '../lib/types';
import { buildSampleMessage, buildWaLink } from '../lib/whatsapp';
import { h, replaceChildren } from './dom';

const block = (title: string, ...body: (Node | string)[]): HTMLElement =>
  h('section', { class: 'block' }, h('h2', {}, title), ...body);

function gallery(data: SiteData): HTMLElement {
  return block(
    'Наши работы',
    h(
      'div',
      { class: 'gallery' },
      ...data.photos.map((p) =>
        h(
          'figure',
          {},
          h('img', { src: p.url, alt: p.caption || 'Работа из нашего цеха', loading: 'lazy' }),
          p.caption ? h('figcaption', {}, p.caption) : null,
        ),
      ),
    ),
  );
}

function reviews(data: SiteData): HTMLElement {
  return block(
    'Отзывы',
    h(
      'div',
      { class: 'reviews' },
      ...data.reviews.map((r) =>
        h(
          'article',
          { class: 'review' },
          r.photoUrl ? h('img', { src: r.photoUrl, alt: `Фото от ${r.author}`, loading: 'lazy' }) : null,
          h('p', {}, r.text),
          h('b', {}, r.author),
        ),
      ),
    ),
  );
}

function process(data: SiteData): HTMLElement {
  return block(
    'Как мы делаем',
    h(
      'ol',
      { class: 'steps' },
      h('li', {}, 'Снимаем мерки и режем EVA под ваш автомобиль вручную.'),
      h('li', {}, 'Шьём кант выбранного цвета по контуру каждого коврика.'),
      h('li', {}, `Готовим заказ за ${data.settings.leadDays} дн. и передаём вам.`),
    ),
  );
}

function samples(data: SiteData): HTMLElement {
  const link = h('a', { class: 'cta cta--ghost', rel: 'noopener', target: '_blank' }, 'Заказать образцы цветов');
  link.href = buildWaLink(data.settings.whatsapp, buildSampleMessage(data.settings));
  return block('Не уверены в цвете?', h('p', { class: 'note' }, 'Пришлём кусочки материала, чтобы выбрать оттенок вживую.'), link);
}

function about(data: SiteData): HTMLElement | null {
  const { about: aboutText, warranty } = data.settings;
  if (!aboutText && !warranty) return null;
  return block('О цехе', aboutText ? h('p', {}, aboutText) : '', warranty ? h('p', { class: 'note' }, warranty) : '');
}

export function renderSections(root: HTMLElement, data: SiteData): void {
  const show = visibleSections(data);
  replaceChildren(root, [
    show.gallery ? gallery(data) : null,
    process(data),
    show.reviews ? reviews(data) : null,
    samples(data),
    about(data),
  ]);
}
