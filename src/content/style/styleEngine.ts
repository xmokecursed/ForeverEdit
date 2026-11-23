import { sanitizeStyleValue } from "@shared/security";

export const EDITABLE_STYLE_PROPS = [
  "color",
  "backgroundColor",
  "backgroundImage",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "width",
  "height",
  "padding",
  "margin",
  "border",
  "borderRadius",
  "opacity",
  "display",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "gap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "position",
  "top",
  "left",
  "right",
  "bottom",
  "zIndex"
] as const;

export type EditableStyleProp = (typeof EDITABLE_STYLE_PROPS)[number];

export function applyStyle(el: HTMLElement, css: Record<string, string>): void {
  for (const [prop, rawValue] of Object.entries(css)) {
    const value = sanitizeStyleValue(rawValue);
    if (value === "" || value === undefined) {
      el.style.removeProperty(camelToKebab(prop));
    } else {
      el.style.setProperty(camelToKebab(prop), value, "important");
    }
  }
}

export function readComputedForEditor(el: HTMLElement): Record<EditableStyleProp, string> {
  const computed = getComputedStyle(el);
  const out = {} as Record<EditableStyleProp, string>;
  for (const prop of EDITABLE_STYLE_PROPS) {
    out[prop] = computed.getPropertyValue(camelToKebab(prop)) || el.style.getPropertyValue(camelToKebab(prop));
  }
  return out;
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}
