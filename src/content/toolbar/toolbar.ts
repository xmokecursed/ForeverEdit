import { MAIN_ICON, TOOL_ICONS, UNPIN_ICON } from "./icons";
import { setSvgIcon } from "./parseSvg";
import { GROUP_ORDER, MOD_KEY, SHORTCUTS } from "@shared/shortcuts";

export type ToolbarAction =
  | "toggle-edit"
  | "move"
  | "multiselect"
  | "hide"
  | "pin"
  | "text"
  | "style"
  | "undo"
  | "redo"
  | "save"
  | "reset"
  | "settings"
  | "help";

export interface ToolbarState {
  activeTool: ToolbarAction | null;
  selectionCount: number;
  allSelectedPinned: boolean;
  dragging: boolean;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
}

interface ButtonDef {
  action: ToolbarAction;
  label: string;
  title: string;
  key?: string;
  toggle?: boolean;
}

const BUTTON_GROUPS: ButtonDef[][] = [
  [
    { action: "move", label: "Move", title: "Move the selected element", key: "M", toggle: true },
    { action: "multiselect", label: "Multi", title: "Select several elements", key: "X", toggle: true },
    { action: "hide", label: "Hide", title: "Hide the selected elements", key: "H" },
    { action: "pin", label: "Pin", title: "Pin or unpin the selected elements", key: "P" },
    { action: "text", label: "Text", title: "Edit text on the page", key: "T", toggle: true },
    { action: "style", label: "Style", title: "Open the style panel", key: "S" }
  ],
  [
    { action: "undo", label: "Undo", title: `Undo (${MOD_KEY}+Z)` },
    { action: "redo", label: "Redo", title: `Redo (${MOD_KEY}+Shift+Z)` }
  ],
  [
    { action: "save", label: "Save", title: `Save your changes (${MOD_KEY}+S)` },
    { action: "reset", label: "Reset", title: "Remove every edit on this site" }
  ],
  [
    { action: "settings", label: "Settings", title: "Open settings" },
    { action: "help", label: "Help", title: "Show keyboard shortcuts", key: "?" },
    { action: "toggle-edit", label: "Exit", title: "Exit Edit Mode (Esc)" }
  ]
];

const ALL_BUTTONS = BUTTON_GROUPS.flat();

function hintFor(state: ToolbarState): string {
  const n = state.selectionCount;
  if (state.activeTool === "move") {
    return state.dragging
      ? "Move the mouse to the new spot and click to drop. Solid line: place before or after. Dashed box: place inside. Esc cancels."
      : "Click the element you want to move.";
  }
  if (state.activeTool === "text") {
    return "Click any text to edit it. Enter saves, Esc cancels.";
  }
  if (state.activeTool === "multiselect") {
    return n > 0
      ? `${n} selected. Keep clicking to add more, or click a selected one to remove it. Press X when done.`
      : "Click elements one by one to select several. Press X when done.";
  }
  if (n === 1) {
    return "1 selected. Pick a tool below. Wrong element? Press the up arrow to select its parent.";
  }
  if (n > 1) {
    return `${n} selected. Hide, Pin, or Style them all at once.`;
  }
  return "Step 1: click any element to select it. Step 2: pick a tool. Press ? for shortcuts.";
}

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function keyCombo(keys: string[]): HTMLElement {
  const wrap = node("span", "fe-keys");
  keys.forEach((k, i) => {
    if (i > 0) wrap.append(node("span", "fe-keys__plus", "+"));
    wrap.append(node("kbd", undefined, k));
  });
  return wrap;
}

export class Toolbar {
  root: HTMLDivElement;
  shadow: ShadowRoot;
  private buttonEls = new Map<ToolbarAction, HTMLButtonElement>();
  private onAction: (a: ToolbarAction) => void;
  private hintEl!: HTMLDivElement;
  private welcomeEl!: HTMLDivElement;
  private helpEl!: HTMLDivElement;
  private handle!: HTMLElement;
  private wrap!: HTMLDivElement;
  private pinIconEl: HTMLElement | null = null;
  private helpOpen = false;

  constructor(onAction: (a: ToolbarAction) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.id = "fe-toolbar-root";
    this.root.style.all = "initial";
    this.shadow = this.root.attachShadow({ mode: "open" });
    this.render();
    this.makeDraggable();
  }

  mount(): void {
    if (!this.root.isConnected) document.documentElement.appendChild(this.root);
  }

  unmount(): void {
    this.welcomeEl.hidden = true;
    this.setHelpOpen(false);
    this.root.remove();
  }

  showWelcome(): void {
    this.welcomeEl.hidden = false;
  }

  setHelpOpen(open: boolean): void {
    this.helpOpen = open;
    this.helpEl.hidden = !open;
    this.buttonEls.get("help")?.classList.toggle("fe-toolbar__btn--active", open);
  }

  private render(): void {
    const style = document.createElement("style");
    style.textContent = TOOLBAR_CSS;

    const wrap = node("div", "fe-wrap");
    this.wrap = wrap;

    this.welcomeEl = this.buildWelcome();
    this.helpEl = this.buildHelp();
    this.hintEl = node("div", "fe-card fe-hint");
    this.hintEl.textContent = hintFor({
      activeTool: null,
      selectionCount: 0,
      allSelectedPinned: false,
      dragging: false,
      canUndo: false,
      canRedo: false,
      dirty: false
    });

    const bar = node("div", "fe-card fe-toolbar");

    const handle = node("div", "fe-toolbar__handle", "⠿");
    handle.title = "Drag to move the toolbar";
    bar.appendChild(handle);
    this.handle = handle;

    const brand = node("div", "fe-toolbar__brand");
    const brandIcon = node("span", "fe-toolbar__brand-icon");
    setSvgIcon(brandIcon, MAIN_ICON);
    brand.append(brandIcon, document.createTextNode("ForeverEdit"));
    bar.appendChild(brand);

    BUTTON_GROUPS.forEach((group, gi) => {
      if (gi > 0) bar.appendChild(node("div", "fe-toolbar__sep"));
      const groupEl = node("div", "fe-toolbar__group");
      for (const def of group) groupEl.appendChild(this.buildButton(def));
      bar.appendChild(groupEl);
    });

    wrap.append(this.welcomeEl, this.helpEl, this.hintEl, bar);
    this.shadow.append(style, wrap);
  }

  private buildButton(def: ButtonDef): HTMLButtonElement {
    const btn = node("button", "fe-toolbar__btn");
    btn.title = def.key ? `${def.title} (${def.key})` : def.title;
    btn.dataset.action = def.action;

    const iconSpan = node("span", "fe-toolbar__icon");
    setSvgIcon(iconSpan, TOOL_ICONS[def.action]);
    const labelSpan = node("span", "fe-toolbar__label", def.label);
    btn.append(iconSpan, labelSpan);
    if (def.key) btn.append(node("span", "fe-toolbar__key", def.key));

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onAction(def.action);
    });
    this.buttonEls.set(def.action, btn);
    if (def.action === "pin") this.pinIconEl = iconSpan;
    return btn;
  }

  private buildWelcome(): HTMLDivElement {
    const card = node("div", "fe-card fe-welcome");
    card.hidden = true;
    card.append(node("div", "fe-welcome__title", "Welcome to ForeverEdit"));
    card.append(
      node("div", "fe-welcome__text", "Change how any website looks. Your edits are saved only on this device.")
    );
    const steps = node("ol", "fe-welcome__steps");
    for (const text of [
      "Click any element on the page to select it.",
      "Pick a tool below: Move, Hide, Pin, Text or Style.",
      "Press Save. Your changes come back every time you visit."
    ]) {
      steps.append(node("li", undefined, text));
    }
    card.append(steps);

    const foot = node("div", "fe-welcome__foot");
    foot.append(node("span", "fe-welcome__tip", "Press ? any time to see all shortcuts."));
    const ok = node("button", "fe-btn", "Got it");
    ok.addEventListener("click", (e) => {
      e.stopPropagation();
      card.hidden = true;
    });
    foot.append(ok);
    card.append(foot);
    return card;
  }

  private buildHelp(): HTMLDivElement {
    const card = node("div", "fe-card fe-help");
    card.hidden = true;

    const head = node("div", "fe-help__head");
    head.append(node("div", "fe-help__title", "Keyboard shortcuts"));
    const close = node("button", "fe-btn fe-btn--ghost", "Close");
    close.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onAction("help");
    });
    head.append(close);
    card.append(head);

    for (const group of GROUP_ORDER) {
      const section = node("div", "fe-help__group");
      section.append(node("div", "fe-help__group-title", group));
      for (const shortcut of SHORTCUTS.filter((s) => s.group === group)) {
        const row = node("div", "fe-help__row");
        row.append(node("span", "fe-help__desc", shortcut.description), keyCombo(shortcut.keys));
        section.append(row);
      }
      card.append(section);
    }
    return card;
  }

  private makeDraggable(): void {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    this.handle.addEventListener("pointerdown", (e) => {
      dragging = true;
      const rect = this.wrap.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.preventDefault();
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      this.wrap.style.left = `${e.clientX - offsetX}px`;
      this.wrap.style.top = `${e.clientY - offsetY}px`;
      this.wrap.style.right = "auto";
      this.wrap.style.bottom = "auto";
    });
    window.addEventListener("pointerup", () => {
      dragging = false;
    });
  }

  setState(state: ToolbarState): void {
    this.hintEl.textContent = hintFor(state);

    for (const def of ALL_BUTTONS) {
      const el = this.buttonEls.get(def.action);
      if (!el) continue;
      const active = def.action === "help" ? this.helpOpen : !!def.toggle && state.activeTool === def.action;
      el.classList.toggle("fe-toolbar__btn--active", active);
      el.toggleAttribute("disabled", this.isDisabled(def.action, state));
    }

    if (this.pinIconEl) {
      const showUnpin = state.selectionCount > 0 && state.allSelectedPinned;
      setSvgIcon(this.pinIconEl, showUnpin ? UNPIN_ICON : TOOL_ICONS.pin);
      const pinBtn = this.buttonEls.get("pin");
      if (pinBtn) {
        const label = pinBtn.querySelector(".fe-toolbar__label");
        if (label) label.textContent = showUnpin ? "Unpin" : "Pin";
        pinBtn.title = showUnpin ? "Unpin the selected elements (P)" : "Pin or unpin the selected elements (P)";
      }
    }
  }

  private isDisabled(action: ToolbarAction, state: ToolbarState): boolean {
    if (action === "undo") return !state.canUndo;
    if (action === "redo") return !state.canRedo;
    if (action === "save") return !state.dirty;
    if (action === "hide" || action === "pin" || action === "style") return state.selectionCount === 0;
    return false;
  }
}

const TOOLBAR_CSS = `
:host { all: initial; }
[hidden] { display: none !important; }
.fe-wrap {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  max-width: calc(100vw - 24px);
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #fafafa;
}
.fe-card {
  background: #0a0a0a;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.18);
}
.fe-hint {
  max-width: 380px;
  font-size: 12px;
  line-height: 1.45;
  padding: 9px 12px;
  color: #e5e5e5;
}
.fe-welcome { width: 330px; padding: 16px; }
.fe-welcome__title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
.fe-welcome__text { font-size: 12px; color: #a3a3a3; line-height: 1.45; }
.fe-welcome__steps { margin: 12px 0; padding-left: 18px; font-size: 12px; line-height: 1.6; }
.fe-welcome__foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.fe-welcome__tip { font-size: 11px; color: #a3a3a3; }
.fe-help { width: 380px; max-height: 60vh; overflow-y: auto; padding: 14px 16px; scrollbar-width: thin; scrollbar-color: #404040 transparent; }
.fe-help__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.fe-help__title { font-size: 14px; font-weight: 700; }
.fe-help__group { margin-top: 12px; }
.fe-help__group-title { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #a3a3a3; margin-bottom: 6px; }
.fe-help__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 12px; }
.fe-help__desc { color: #e5e5e5; }
.fe-keys { display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0; }
.fe-keys__plus { color: #737373; font-size: 10px; }
kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  background: #171717;
  color: #fafafa;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 1px 6px;
}
.fe-btn {
  background: #fff;
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.fe-btn:hover { background: #e5e5e5; }
.fe-btn--ghost { background: transparent; color: #fafafa; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3); }
.fe-btn--ghost:hover { background: rgba(255, 255, 255, 0.1); }
.fe-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px;
  font-size: 12px;
  user-select: none;
}
.fe-toolbar__handle { cursor: grab; padding: 0 6px; opacity: 0.5; font-size: 14px; }
.fe-toolbar__handle:active { cursor: grabbing; }
.fe-toolbar__brand { display: flex; align-items: center; gap: 6px; font-weight: 700; padding: 0 8px 0 2px; white-space: nowrap; }
.fe-toolbar__brand-icon { width: 14px; height: 14px; display: flex; }
.fe-toolbar__brand-icon svg { width: 100%; height: 100%; }
.fe-toolbar__sep { width: 1px; height: 28px; background: rgba(255, 255, 255, 0.18); margin: 0 4px; }
.fe-toolbar__group { display: flex; gap: 2px; }
.fe-toolbar__btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 40px;
  background: transparent;
  border: none;
  color: inherit;
  border-radius: 8px;
  padding: 6px 7px 5px;
  cursor: pointer;
  font: inherit;
}
.fe-toolbar__btn:hover { background: rgba(255, 255, 255, 0.12); }
.fe-toolbar__btn:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
.fe-toolbar__btn--active { background: #fff; color: #000; }
.fe-toolbar__btn--active:hover { background: #e5e5e5; }
.fe-toolbar__btn[disabled] { opacity: 0.3; cursor: default; pointer-events: none; }
.fe-toolbar__icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }
.fe-toolbar__icon svg { width: 100%; height: 100%; }
.fe-toolbar__label { font-size: 9px; line-height: 1; }
.fe-toolbar__key { position: absolute; top: 2px; right: 4px; font-size: 8px; font-weight: 700; line-height: 1; opacity: 0.55; }
`;
