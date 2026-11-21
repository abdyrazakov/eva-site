export type ColorUsage = 'mat' | 'trim' | 'both';

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  usage: ColorUsage;
}

export interface TrunkClass {
  id: string;
  name: string;
  areaM2: number;
}

export interface Settings {
  shopName: string;
  whatsapp: string;
  leadDays: number;
  priceInteriorBorders: number;
  priceInteriorPlain: number;
  trunkPricePerM2: number;
  about: string;
  warranty: string;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
}

export interface Review {
  id: string;
  author: string;
  text: string;
  photoUrl?: string;
}

/** Настоящее фото коврика для конкретного сочетания цвета коврика и канта. */
export interface ComboPhoto {
  matId: string;
  trimId: string;
  url: string;
}

export interface SiteData {
  settings: Settings;
  colors: ColorOption[];
  trunkClasses: TrunkClass[];
  photos: Photo[];
  reviews: Review[];
  comboPhotos: ComboPhoto[];
}

export type Steering = 'left' | 'right';

export interface Order {
  borders: boolean;
  trunk: TrunkClass | null;
  matColor: ColorOption;
  trimColor: ColorOption;
  car: string;
  steering: Steering;
}
