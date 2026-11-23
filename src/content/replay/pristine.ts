import { FE_ID_ATTR } from "@content/selectors/fingerprint";

interface Snapshot {
  style?: string;
  className?: string;
  text?: string;
  attrs?: Record<string, string | null>;
  moveAnchor?: Comment;
}

const registry = new Map<string, Snapshot>();

function feIdOf(el: Element): string | null {
  return el.getAttribute(FE_ID_ATTR);
}

function getOrCreate(id: string): Snapshot {
  let snap = registry.get(id);
  if (!snap) {
    snap = {};
    registry.set(id, snap);
  }
  return snap;
}

export function capturePristineStyle(el: Element): void {
  const id = feIdOf(el);
  if (!id) return;
  const snap = getOrCreate(id);
  if (snap.style === undefined) snap.style = el.getAttribute("style") ?? "";
}

const TRANSIENT_UI_CLASSES = ["fe-hover-highlight", "fe-selected", "fe-dragging", "fe-editable-text"];

export function capturePristineClass(el: Element): void {
  const id = feIdOf(el);
  if (!id) return;
  const snap = getOrCreate(id);
  if (snap.className === undefined) {
    const classes = (el.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter((c) => c && !TRANSIENT_UI_CLASSES.includes(c));
    snap.className = classes.join(" ");
  }
}

export function capturePristineText(el: Element): void {
  const id = feIdOf(el);
  if (!id) return;
  const snap = getOrCreate(id);
  if (snap.text === undefined) snap.text = el.textContent ?? "";
}

export function capturePristineAttr(el: Element, attr: string): void {
  const id = feIdOf(el);
  if (!id) return;
  const snap = getOrCreate(id);
  snap.attrs = snap.attrs ?? {};
  if (!(attr in snap.attrs)) snap.attrs[attr] = el.getAttribute(attr);
}

export function capturePristineMove(el: Element): void {
  const id = feIdOf(el);
  if (!id || !el.parentNode) return;
  const snap = getOrCreate(id);
  if (!snap.moveAnchor) {
    const anchor = document.createComment(`foreveredit-anchor-${id}`);
    el.parentNode.insertBefore(anchor, el);
    snap.moveAnchor = anchor;
  }
}

export function revertAll(): void {
  for (const [id, snap] of registry.entries()) {
    const el = document.querySelector(`[${FE_ID_ATTR}="${CSS.escape(id)}"]`);
    if (!el) continue;

    if (snap.moveAnchor?.parentNode) {
      snap.moveAnchor.parentNode.insertBefore(el, snap.moveAnchor);
    }
    if (snap.style !== undefined) {
      if (snap.style) el.setAttribute("style", snap.style);
      else el.removeAttribute("style");
    }
    if (snap.className !== undefined) {
      if (snap.className) el.setAttribute("class", snap.className);
      else el.removeAttribute("class");
    }
    if (snap.text !== undefined) {
      el.textContent = snap.text;
    }
    if (snap.attrs) {
      for (const [attr, val] of Object.entries(snap.attrs)) {
        if (val === null) el.removeAttribute(attr);
        else el.setAttribute(attr, val);
      }
    }
  }
}

export function clearPristineRegistry(): void {
  for (const snap of registry.values()) {
    snap.moveAnchor?.remove();
  }
  registry.clear();
}
