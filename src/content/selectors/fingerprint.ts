import type { ElementFingerprint } from "@shared/types";

const FE_ID_ATTR = "data-fe-id";
let idCounter = 0;

function ensureFeId(el: Element): string {
  const existing = el.getAttribute(FE_ID_ATTR);
  if (existing) return existing;
  const id = `fe-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
  el.setAttribute(FE_ID_ATTR, id);
  return id;
}

function safeClassList(el: Element): string[] {
  return Array.from(el.classList).filter(
    (c) => !/^[a-z0-9_-]{0,3}[0-9a-f]{6,}$/i.test(c) && !/^css-[a-z0-9]+$/i.test(c)
  );
}

function cssSelectorFor(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.documentElement) {
    let selector = node.tagName.toLowerCase();
    const classes = safeClassList(node);
    if (classes.length) {
      selector += "." + classes.slice(0, 3).map((c) => CSS.escape(c)).join(".");
    }
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(node) + 1;
        selector += `:nth-of-type(${idx})`;
      }
    }
    parts.unshift(selector);
    node = node.parentElement;
    if (parts.length >= 6) break;
  }
  return parts.join(" > ");
}

function xpathFor(el: Element): string {
  if (el.id) return `//*[@id="${el.id}"]`;
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.documentElement) {
    let index = 1;
    let sibling = node.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === node.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
    node = node.parentElement;
  }
  return "/" + parts.join("/");
}

function domPathFor(el: Element): { tag: string; index: number }[] {
  const path: { tag: string; index: number }[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.documentElement) {
    const parent: Element | null = node.parentElement;
    const index = parent ? Array.from(parent.children).indexOf(node) : 0;
    path.unshift({ tag: node.tagName.toLowerCase(), index });
    node = parent;
  }
  return path;
}

function shortText(s: string | null | undefined, max = 60): string | undefined {
  const trimmed = s?.trim().replace(/\s+/g, " ");
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function stableAttrs(el: Element): Record<string, string> {
  const keep = ["name", "aria-label", "role", "type", "placeholder", "alt", "title", "href", "for"];
  const out: Record<string, string> = {};
  for (const attr of keep) {
    const v = el.getAttribute(attr);
    if (v) out[attr] = attr === "href" ? v.split("?")[0].slice(0, 200) : v.slice(0, 200);
  }
  return out;
}

export function buildFingerprint(el: Element): ElementFingerprint {
  const parent = el.parentElement;
  const tagIndex = parent
    ? Array.from(parent.children).filter((c) => c.tagName === el.tagName).indexOf(el)
    : 0;

  return {
    feId: ensureFeId(el),
    id: el.id || undefined,
    classes: safeClassList(el),
    tag: el.tagName.toLowerCase(),
    cssSelector: cssSelectorFor(el),
    xpath: xpathFor(el),
    domPath: domPathFor(el),
    nearbyText: shortText(el.textContent),
    siblingText: {
      prev: shortText(el.previousElementSibling?.textContent),
      next: shortText(el.nextElementSibling?.textContent)
    },
    parentTagIndex: tagIndex,
    attrs: stableAttrs(el)
  };
}

function resolveByFeId(fp: ElementFingerprint): Element | null {
  if (!fp.feId) return null;
  return document.querySelector(`[${FE_ID_ATTR}="${CSS.escape(fp.feId)}"]`);
}

function resolveById(fp: ElementFingerprint): Element | null {
  if (!fp.id) return null;
  const el = document.getElementById(fp.id);
  return el && el.tagName.toLowerCase() === fp.tag ? el : null;
}

function resolveByCss(fp: ElementFingerprint): Element | null {
  try {
    return document.querySelector(fp.cssSelector);
  } catch {
    return null;
  }
}

function resolveByXpath(fp: ElementFingerprint): Element | null {
  try {
    const result = document.evaluate(fp.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return (result.singleNodeValue as Element) ?? null;
  } catch {
    return null;
  }
}

function resolveByDomPath(fp: ElementFingerprint): Element | null {
  let node: Element = document.documentElement;
  for (const step of fp.domPath) {
    const child = node.children[step.index];
    if (!child || child.tagName.toLowerCase() !== step.tag) return null;
    node = child;
  }
  return node;
}

function scoreCandidate(el: Element, fp: ElementFingerprint): number {
  let score = 0;
  if (el.tagName.toLowerCase() === fp.tag) score += 1;
  const classes = safeClassList(el);
  score += classes.filter((c) => fp.classes.includes(c)).length;
  const text = shortText(el.textContent);
  if (text && fp.nearbyText && text === fp.nearbyText) score += 3;
  for (const [k, v] of Object.entries(fp.attrs)) {
    if (el.getAttribute(k) === v) score += 2;
  }
  return score;
}

function resolveByFuzzySearch(fp: ElementFingerprint): Element | null {
  const candidates = Array.from(document.getElementsByTagName(fp.tag));
  if (candidates.length === 0) return null;
  let best: Element | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    const s = scoreCandidate(c, fp);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return bestScore >= 3 ? best : null;
}

export type ResolveStrategy =
  | "feId"
  | "id"
  | "css"
  | "xpath"
  | "domPath"
  | "fuzzy";

const STRATEGIES: [ResolveStrategy, (fp: ElementFingerprint) => Element | null][] = [
  ["feId", resolveByFeId],
  ["id", resolveById],
  ["css", resolveByCss],
  ["xpath", resolveByXpath],
  ["domPath", resolveByDomPath],
  ["fuzzy", resolveByFuzzySearch]
];

export function resolveFingerprint(
  fp: ElementFingerprint
): { el: Element; strategy: ResolveStrategy } | null {
  for (const [name, fn] of STRATEGIES) {
    try {
      const el = fn(fp);
      if (el && el.isConnected) return { el, strategy: name };
    } catch {
    }
  }
  return null;
}

export { FE_ID_ATTR };
