import { buildMasks, hexToRgb, recolor } from '../lib/recolor';

export interface PhotoPreview {
  element: HTMLCanvasElement;
  /** Перекрашивает базовое фото; mirrored зеркалит его для правого руля. */
  draw(matHex: string, trimHex: string, mirrored: boolean): void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Cannot load ${src}`));
    img.src = src;
  });
}

// Возвращает null, если фото или canvas недоступны: тогда конфигуратор показывает SVG-схему.
export async function createPhotoPreview(src: string): Promise<PhotoPreview | null> {
  try {
    const img = await loadImage(src);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = 'cfg__photo';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Коврики выбранных цветов');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const base = ctx.getImageData(0, 0, width, height);
    const masks = buildMasks(base.data, width, height);

    return {
      element: canvas,
      draw(matHex, trimHex, mirrored) {
        const painted = recolor(base.data, masks, hexToRgb(matHex), hexToRgb(trimHex));
        ctx.putImageData(new ImageData(painted, width, height), 0, 0);
        canvas.style.transform = mirrored ? 'scaleX(-1)' : '';
      },
    };
  } catch {
    return null;
  }
}
