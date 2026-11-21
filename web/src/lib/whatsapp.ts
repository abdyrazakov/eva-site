import { orderTotal } from './pricing';
import type { Order, Settings, Steering } from './types';

const MAX_CAR_LENGTH = 120;

export function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export type OrderErrors = { car?: string; steering?: string };

export function validateOrder(o: {
  car: string;
  steering: Steering | null;
}): { ok: true } | { ok: false; errors: OrderErrors } {
  const errors: OrderErrors = {};
  const car = o.car.trim();
  if (car.length === 0) errors.car = 'Укажите марку, модель и год';
  else if (car.length > MAX_CAR_LENGTH) errors.car = `Не более ${MAX_CAR_LENGTH} символов`;
  if (o.steering === null) errors.steering = 'Выберите руль';
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}

const steeringLabel = (s: Steering): string => (s === 'left' ? 'левый' : 'правый');

export function buildOrderMessage(o: Order, s: Settings): string {
  const { total, trunkApprox } = orderTotal(o, s);
  const set = o.borders ? 'салон с бортами' : 'салон без бортов';
  const trunk = o.trunk ? `, багажник (${o.trunk.name})` : ', без багажника';
  const price =
    total === null
      ? 'цену уточним после уточнения размера багажника'
      : `${total} сом${trunkApprox ? ' (ориентировочно, размер багажника подтвердим)' : ''}`;
  return [
    `Здравствуйте! Хочу заказать EVA-коврики (${s.shopName}).`,
    `Набор: ${set}${trunk}`,
    `Цвет коврика: ${o.matColor.name}`,
    `Цвет канта: ${o.trimColor.name}`,
    `Авто: ${o.car.trim()}`,
    `Руль: ${steeringLabel(o.steering)}`,
    `Итого: ${price}`,
    `Срок изготовления: ${s.leadDays} дн.`,
  ].join('\n');
}

export function buildSampleMessage(s: Settings): string {
  return `Здравствуйте! Хочу заказать образцы цветов EVA (${s.shopName}).`;
}

export function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
