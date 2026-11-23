import { EDITABLE_STYLE_PROPS, readComputedForEditor, type EditableStyleProp } from "./styleEngine";

type ControlType = "color" | "slider" | "select" | "text";

interface Section {
  title: string;
  props: EditableStyleProp[];
  openByDefault?: boolean;
}

const SECTIONS: Section[] = [
  { title: "Typography", props: ["color", "fontFamily", "fontSize", "fontWeight"], openByDefault: true },
  { title: "Appearance", props: ["backgroundColor", "backgroundImage", "opacity", "border", "borderRadius"], openByDefault: true },
  { title: "Size & spacing", props: ["width", "height", "padding", "margin"] },
  { title: "Layout", props: ["display", "flexDirection", "justifyContent", "alignItems", "gap", "gridTemplateColumns", "gridTemplateRows"] },
  { title: "Position", props: ["position", "top", "left", "right", "bottom", "zIndex"] }
];

const SELECT_OPTIONS: Partial<Record<EditableStyleProp, string[]>> = {
  display: ["block", "inline", "inline-block", "flex", "inline-flex", "grid", "none"],
  position: ["static", "relative", "absolute", "fixed", "sticky"],
  flexDirection: ["row", "row-reverse", "column", "column-reverse"],
  justifyContent: ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"],
  alignItems: ["flex-start", "flex-end", "center", "stretch", "baseline"],
  fontWeight: ["300", "400", "500", "600", "700", "800"]
};

const SLIDER_PROPS: Partial<Record<EditableStyleProp, { min: number; max: number; step: number; unit: string }>> = {
  fontSize: { min: 8, max: 96, step: 1, unit: "px" },
  width: { min: 0, max: 2000, step: 1, unit: "px" },
  height: { min: 0, max: 2000, step: 1, unit: "px" },
  opacity: { min: 0, max: 1, step: 0.05, unit: "" },
  zIndex: { min: -10, max: 999999, step: 1, unit: "" },
  borderRadius: { min: 0, max: 200, step: 1, unit: "px" },
  gap: { min: 0, max: 200, step: 1, unit: "px" }
};

const COLOR_PROPS: EditableStyleProp[] = ["color", "backgroundColor"];

const PROP_LABELS: Partial<Record<EditableStyleProp, string>> = {
  backgroundColor: "Background",
  backgroundImage: "Background image",
  fontFamily: "Font",
  fontSize: "Font size",
  fontWeight: "Weight",
  borderRadius: "Corner radius",
  zIndex: "Stack order",
  flexDirection: "Direction",
  justifyContent: "Justify",
  alignItems: "Align",
  gridTemplateColumns: "Grid columns",
  gridTemplateRows: "Grid rows"
};

function controlTypeFor(prop: EditableStyleProp): ControlType {
  if (COLOR_PROPS.includes(prop)) return "color";
  if (SELECT_OPTIONS[prop]) return "select";
  if (SLIDER_PROPS[prop]) return "slider";
  return "text";
}

function toHex(value: string): string {
  const el = document.createElement("div");
  el.style.color = value;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  const m = rgb.match(/\d+/g);
  if (!m) return "#000000";
  const [r, g, b] = m.map(Number);
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function labelFor(prop: EditableStyleProp): string {
  return PROP_LABELS[prop] ?? prop.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export class StylePanel {
  root: HTMLDivElement;
  private shadow: ShadowRoot;
  private targets: HTMLElement[] = [];
  private onChange: (css: Record<string, string>) => void;
  private onCommit: () => void;

  constructor(onChange: (css: Record<string, string>) => void, onCommit: () => void) {
    this.onChange = onChange;
    this.onCommit = onCommit;
    this.root = document.createElement("div");
    this.root.id = "fe-style-panel-root";
    this.shadow = this.root.attachShadow({ mode: "open" });
    this.root.style.display = "none";
    document.documentElement.appendChild(this.root);
  }

  open(targets: HTMLElement[]): void {
    if (targets.length === 0) return;
    this.targets = targets;
    this.renderFor(targets[0]);
    this.root.style.display = "block";
  }

  close(): void {
    this.root.style.display = "none";
    this.targets = [];
  }

  isOpen(): boolean {
    return this.root.style.display !== "none";
  }

  private renderFor(primary: HTMLElement): void {
    const values = readComputedForEditor(primary);
    const style = document.createElement("style");
    style.textContent = PANEL_CSS;

    const panel = document.createElement("div");
    panel.className = "fe-panel";

    const header = document.createElement("div");
    header.className = "fe-panel__header";
    const titleWrap = document.createElement("div");
    const title = document.createElement("div");
    title.className = "fe-panel__title";
    title.textContent = "Style editor";
    titleWrap.appendChild(title);
    if (this.targets.length > 1) {
      const subtitle = document.createElement("div");
      subtitle.className = "fe-panel__subtitle";
      subtitle.textContent = `Editing ${this.targets.length} elements at once`;
      titleWrap.appendChild(subtitle);
    }
    header.appendChild(titleWrap);
    const closeBtn = document.createElement("button");
    closeBtn.className = "fe-panel__close";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close";
    closeBtn.addEventListener("click", () => this.close());
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const body = document.createElement("div");
    body.className = "fe-panel__body";

    for (const section of SECTIONS) {
      const details = document.createElement("details");
      details.className = "fe-panel__section";
      if (section.openByDefault) details.open = true;

      const summary = document.createElement("summary");
      summary.className = "fe-panel__section-title";
      summary.textContent = section.title;
      details.appendChild(summary);

      const sectionBody = document.createElement("div");
      sectionBody.className = "fe-panel__section-body";

      for (const prop of section.props) {
        sectionBody.appendChild(this.buildRow(prop, values[prop]));
      }

      details.appendChild(sectionBody);
      body.appendChild(details);
    }

    panel.appendChild(body);
    this.shadow.replaceChildren(style, panel);
  }

  private buildRow(prop: EditableStyleProp, current: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "fe-panel__row";

    const labelText = document.createElement("span");
    labelText.className = "fe-panel__label";
    labelText.textContent = labelFor(prop);
    row.appendChild(labelText);

    const controlWrap = document.createElement("div");
    controlWrap.className = "fe-panel__control";
    controlWrap.appendChild(this.buildControl(prop, current));
    row.appendChild(controlWrap);

    return row;
  }

  private buildControl(prop: EditableStyleProp, current: string): HTMLElement {
    const type = controlTypeFor(prop);
    const emit = (value: string, commit: boolean) => {
      this.onChange({ [prop]: value });
      if (commit) this.onCommit();
    };

    if (type === "color") {
      const wrap = document.createElement("div");
      wrap.className = "fe-panel__color-wrap";
      const input = document.createElement("input");
      input.type = "color";
      input.className = "fe-panel__color";
      let hex = "#000000";
      try {
        hex = toHex(current || "#000000");
      } catch {
      }
      input.value = hex;
      const readout = document.createElement("span");
      readout.className = "fe-panel__color-readout";
      readout.textContent = hex;
      input.addEventListener("input", () => {
        readout.textContent = input.value;
        emit(input.value, false);
      });
      input.addEventListener("change", () => emit(input.value, true));
      wrap.append(input, readout);
      return wrap;
    }

    if (type === "select") {
      const select = document.createElement("select");
      select.className = "fe-panel__select";
      for (const opt of SELECT_OPTIONS[prop] ?? []) {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (current.trim() === opt) o.selected = true;
        select.appendChild(o);
      }
      select.addEventListener("change", () => emit(select.value, true));
      return select;
    }

    if (type === "slider") {
      const cfg = SLIDER_PROPS[prop]!;
      const wrap = document.createElement("div");
      wrap.className = "fe-panel__slider-wrap";
      const input = document.createElement("input");
      input.type = "range";
      input.min = String(cfg.min);
      input.max = String(cfg.max);
      input.step = String(cfg.step);
      input.value = String(parseFloat(current) || 0);
      const readout = document.createElement("span");
      readout.className = "fe-panel__readout";
      readout.textContent = `${input.value}${cfg.unit}`;
      input.addEventListener("input", () => {
        readout.textContent = `${input.value}${cfg.unit}`;
        emit(`${input.value}${cfg.unit}`, false);
      });
      input.addEventListener("change", () => emit(`${input.value}${cfg.unit}`, true));
      wrap.append(input, readout);
      return wrap;
    }

    const input = document.createElement("input");
    input.type = "text";
    input.className = "fe-panel__text";
    input.value = current;
    input.addEventListener("change", () => emit(input.value, true));
    return input;
  }
}

const PANEL_CSS = `
:host { all: initial; }
.fe-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 280px;
  max-height: 75vh;
  overflow-y: auto;
  background: #0a0a0a;
  color: #f4f4f5;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 12px;
  z-index: 2147483647;
  scrollbar-width: thin;
  scrollbar-color: #404040 transparent;
}
.fe-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky;
  top: 0;
  background: #0a0a0a;
  z-index: 1;
}
.fe-panel__title { font-weight: 600; font-size: 13px; }
.fe-panel__subtitle { font-size: 10px; color: #a3a3a3; margin-top: 2px; }
.fe-panel__close {
  background: rgba(255,255,255,0.06);
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 11px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex-shrink: 0;
}
.fe-panel__close:hover { background: rgba(255,255,255,0.12); }
.fe-panel__body { padding: 4px 6px 10px; }
.fe-panel__section { border-bottom: 1px solid rgba(255,255,255,0.05); }
.fe-panel__section:last-child { border-bottom: none; }
.fe-panel__section-title {
  cursor: pointer;
  list-style: none;
  padding: 10px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #a3a3a3;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fe-panel__section-title::-webkit-details-marker { display: none; }
.fe-panel__section-title::after {
  content: "›";
  transform: rotate(90deg);
  transition: transform 0.15s;
  font-size: 13px;
  opacity: 0.6;
}
.fe-panel__section[open] > .fe-panel__section-title::after { transform: rotate(-90deg); }
.fe-panel__section-body { padding: 2px 8px 12px; display: flex; flex-direction: column; gap: 10px; }
.fe-panel__row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.fe-panel__label { opacity: 0.8; min-width: 76px; flex-shrink: 0; }
.fe-panel__control { display: flex; justify-content: flex-end; flex: 1; min-width: 0; }
.fe-panel__color-wrap { display: flex; align-items: center; gap: 6px; }
.fe-panel__color {
  width: 26px; height: 26px; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 7px; background: none; cursor: pointer; padding: 0;
}
.fe-panel__color-readout {
  font-variant-numeric: tabular-nums; opacity: 0.65; font-size: 10.5px; width: 54px;
}
.fe-panel__select, .fe-panel__text {
  background: #171717; color: inherit; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 7px; padding: 4px 7px; font: inherit; width: 140px;
}
.fe-panel__select:focus, .fe-panel__text:focus { outline: 1px solid #ffffff; }
.fe-panel__slider-wrap { display: flex; align-items: center; gap: 8px; width: 100%; justify-content: flex-end; }
.fe-panel__slider-wrap input[type="range"] {
  width: 96px; accent-color: #ffffff;
}
.fe-panel__readout { font-variant-numeric: tabular-nums; opacity: 0.65; width: 46px; text-align: right; font-size: 10.5px; }
`;
