import { isSafeHex, renderCabinSvg } from '../lib/cabin-svg';
import { colorsFor, initialState, reconcile, toOrder, type ConfigState } from '../lib/configurator';
import { interiorPrice, orderTotal, trunkPrice } from '../lib/pricing';
import type { ColorOption, SiteData, Steering } from '../lib/types';
import { buildOrderMessage, buildWaLink, validateOrder } from '../lib/whatsapp';
import { h, replaceChildren } from './dom';

export interface ConfiguratorView {
  update(data: SiteData): void;
}

const NEUTRAL = '#999999';
const money = (n: number): string => `${n.toLocaleString('ru-RU')} сом`;

function choice(label: string, sub: string, pressed: boolean, onClick: () => void): HTMLButtonElement {
  const btn = h(
    'button',
    { type: 'button', class: 'choice', 'aria-pressed': String(pressed) },
    h('span', { class: 'choice__label' }, label),
    sub ? h('span', { class: 'choice__sub' }, sub) : null,
  );
  btn.addEventListener('click', onClick);
  return btn;
}

function swatch(color: ColorOption, pressed: boolean, onClick: () => void): HTMLButtonElement {
  const btn = h('button', {
    type: 'button',
    class: 'swatch',
    title: color.name,
    'aria-label': color.name,
    'aria-pressed': String(pressed),
  });
  btn.style.background = isSafeHex(color.hex) ? color.hex : NEUTRAL;
  btn.addEventListener('click', onClick);
  return btn;
}

function group(title: string, body: HTMLElement): HTMLElement {
  return h('fieldset', { class: 'group' }, h('legend', {}, title), body);
}

export function mountConfigurator(root: HTMLElement, initial: SiteData): ConfiguratorView {
  let data = initial;
  let state: ConfigState = initialState(data);
  let showErrors = false;

  const preview = h('div', { class: 'cfg__svg' });
  const priceEl = h('p', { class: 'price' });
  const noteEl = h('p', { class: 'note' });
  const leadEl = h('p', { class: 'note' });
  const bordersBox = h('div', { class: 'choices' });
  const trunkBox = h('div', { class: 'choices' });
  const matBox = h('div', { class: 'swatches' });
  const trimBox = h('div', { class: 'swatches' });
  const steeringBox = h('div', { class: 'choices choices--row' });
  const carInput = h('input', {
    type: 'text',
    class: 'input',
    maxlength: 120,
    placeholder: 'Например: Toyota Camry 2015',
    autocomplete: 'off',
  });
  const carError = h('p', { class: 'error', role: 'alert' });
  const steeringError = h('p', { class: 'error', role: 'alert' });
  const orderBtn = h('button', { type: 'button', class: 'cta' }, 'Заказать в WhatsApp');
  const matTitle = h('span');
  const trimTitle = h('span');

  const set = (patch: Partial<ConfigState>): void => {
    state = { ...state, ...patch };
    render();
  };

  const colorHex = (kind: 'mat' | 'trim', id: string): string =>
    colorsFor(data, kind).find((c) => c.id === id)?.hex ?? NEUTRAL;
  const colorName = (kind: 'mat' | 'trim', id: string): string | null =>
    colorsFor(data, kind).find((c) => c.id === id)?.name ?? null;

  function render(): void {
    const s = data.settings;
    replaceChildren(bordersBox, [
      choice('С бортами', money(interiorPrice(true, s)), state.borders, () => set({ borders: true })),
      choice('Без бортов', money(interiorPrice(false, s)), !state.borders, () => set({ borders: false })),
    ]);
    replaceChildren(trunkBox, [
      choice('Без багажника', '', state.trunkId === null, () => set({ trunkId: null })),
      ...data.trunkClasses.map((t) => {
        const p = trunkPrice(t, s);
        return choice(t.name, p === null ? 'цена по запросу' : `+ ${money(p)}`, state.trunkId === t.id, () =>
          set({ trunkId: t.id }),
        );
      }),
    ]);
    replaceChildren(
      matBox,
      colorsFor(data, 'mat').map((c) => swatch(c, c.id === state.matId, () => set({ matId: c.id }))),
    );
    replaceChildren(
      trimBox,
      colorsFor(data, 'trim').map((c) => swatch(c, c.id === state.trimId, () => set({ trimId: c.id }))),
    );
    replaceChildren(steeringBox, [
      choice('Левый руль', '', state.steering === 'left', () => set({ steering: 'left' })),
      choice('Правый руль', '', state.steering === 'right', () => set({ steering: 'right' })),
    ]);
    replaceChildren(matTitle, [colorName('mat', state.matId)]);
    replaceChildren(trimTitle, [colorName('trim', state.trimId)]);

    preview.innerHTML = renderCabinSvg({
      matHex: colorHex('mat', state.matId),
      trimHex: colorHex('trim', state.trimId),
      borders: state.borders,
      withTrunk: state.trunkId !== null,
      steering: (state.steering ?? 'left') as Steering,
    });

    const trunk = data.trunkClasses.find((t) => t.id === state.trunkId) ?? null;
    const { total, trunkApprox } = orderTotal({ borders: state.borders, trunk }, s);
    priceEl.textContent =
      total === null ? 'Цену уточним в WhatsApp' : `${trunkApprox ? '≈ ' : ''}${money(total)}`;
    noteEl.textContent = trunkApprox ? 'Багажник считаем по размеру: точную цену подтвердим в WhatsApp.' : '';
    leadEl.textContent = `Срок изготовления: ${s.leadDays} дн.`;

    const check = validateOrder({ car: state.car, steering: state.steering });
    carError.textContent = showErrors && !check.ok ? (check.errors.car ?? '') : '';
    steeringError.textContent = showErrors && !check.ok ? (check.errors.steering ?? '') : '';
    orderBtn.disabled = data.colors.length === 0;
  }

  carInput.addEventListener('input', () => {
    state = { ...state, car: carInput.value };
    render();
  });
  orderBtn.addEventListener('click', () => {
    showErrors = true;
    if (!validateOrder({ car: state.car, steering: state.steering }).ok) {
      render();
      return;
    }
    const link = buildWaLink(data.settings.whatsapp, buildOrderMessage(toOrder(state, data), data.settings));
    window.open(link, '_blank', 'noopener');
  });

  root.append(
    h(
      'div',
      { class: 'cfg' },
      h('div', { class: 'cfg__preview' }, preview, priceEl, noteEl, leadEl),
      h(
        'div',
        { class: 'cfg__controls' },
        group('Набор салона', bordersBox),
        group('Багажник', trunkBox),
        group('Цвет коврика', h('div', {}, matBox, h('p', { class: 'picked' }, matTitle))),
        group('Цвет канта', h('div', {}, trimBox, h('p', { class: 'picked' }, trimTitle))),
        group('Ваш автомобиль', h('div', {}, carInput, carError, steeringBox, steeringError)),
        orderBtn,
      ),
    ),
  );
  render();

  return {
    update(next: SiteData): void {
      data = next;
      state = reconcile(state, data);
      render();
    },
  };
}
