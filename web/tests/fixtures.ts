import type { ColorOption, Settings, SiteData, TrunkClass } from '../src/lib/types';

export const defaultSettings: Settings = {
  shopName: 'Ева Тоха',
  whatsapp: '996000000000',
  leadDays: 3,
  priceInteriorBorders: 2200,
  priceInteriorPlain: 1700,
  trunkPricePerM2: 1300,
  about: 'Ручная резка и пошив канта в собственном цехе.',
  warranty: 'Гарантия на пошив.',
};

const color = (id: string, name: string, hex: string): ColorOption => ({
  id,
  name,
  hex,
  usage: 'both',
});

export const defaultColors: ColorOption[] = [
  color('red', 'Красный', '#E53935'),
  color('orange', 'Оранжевый', '#FB8C00'),
  color('yellow', 'Жёлтый', '#FDD835'),
  color('green', 'Зелёный', '#43A047'),
  color('lightblue', 'Голубой', '#29B6F6'),
  color('blue', 'Синий', '#1E4FD8'),
  color('violet', 'Фиолетовый', '#8E24AA'),
  color('black', 'Чёрный', '#111111'),
  color('grey', 'Серый', '#8D8D8D'),
  color('white', 'Белый', '#F5F5F5'),
  color('pink', 'Розовый', '#EC407A'),
];

export const defaultTrunkClasses: TrunkClass[] = [
  { id: 'sedan', name: 'Седан', areaM2: 1.0 },
  { id: 'crossover', name: 'Кроссовер', areaM2: 1.3 },
  { id: 'wagon', name: 'Универсал', areaM2: 1.6 },
  { id: 'minivan', name: 'Минивэн', areaM2: 1.8 },
];

export const siteDataFixture: SiteData = {
  settings: defaultSettings,
  colors: defaultColors,
  trunkClasses: defaultTrunkClasses,
  photos: [],
  reviews: [],
};
