type Attrs = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;

// Небольшой помощник: создаёт элемент, текст вставляется как textContent (безопасно для данных из БД).
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') el.className = String(value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  append(el, children);
  return el;
}

export function append(el: Element, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

export function replaceChildren(el: Element, children: Child[]): void {
  el.replaceChildren();
  append(el, children);
}
