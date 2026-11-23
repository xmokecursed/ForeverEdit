import type { Operation } from "@shared/types";
import { resolveFingerprint } from "@content/selectors/fingerprint";
import { applyStyle } from "@content/style/styleEngine";
import { pinElement, unpinElement } from "@content/editor/pin";
import { isDangerousAttribute, isDangerousAttributeValue } from "@shared/security";
import {
  capturePristineAttr,
  capturePristineClass,
  capturePristineMove,
  capturePristineStyle,
  capturePristineText,
  revertAll
} from "./pristine";

export interface ReplayResult {
  applied: number;
  skipped: { op: Operation; reason: string }[];
}

const hiddenStyleMarker = "data-fe-hidden";

export function replayOperations(operations: Operation[]): ReplayResult {
  revertAll();

  const sorted = [...operations].sort((a, b) => a.seq - b.seq);
  const result: ReplayResult = { applied: 0, skipped: [] };

  for (const op of sorted) {
    try {
      const applied = applyOne(op);
      if (applied) result.applied++;
      else result.skipped.push({ op, reason: "target not found" });
    } catch (e) {
      result.skipped.push({ op, reason: String(e) });
    }
  }
  return result;
}

export function revertToOriginal(): void {
  revertAll();
}

function applyOne(op: Operation): boolean {
  switch (op.type) {
    case "move": {
      const targetHit = resolveFingerprint(op.target);
      const parentHit = resolveFingerprint(op.newParent);
      if (!targetHit || !parentHit) return false;
      capturePristineMove(targetHit.el);
      const beforeEl = op.beforeSibling ? resolveFingerprint(op.beforeSibling)?.el ?? null : null;
      parentHit.el.insertBefore(targetHit.el, beforeEl);
      return true;
    }
    case "hide": {
      const hit = resolveFingerprint(op.target);
      if (!hit) return false;
      capturePristineStyle(hit.el);
      (hit.el as HTMLElement).style.setProperty("display", "none", "important");
      hit.el.setAttribute(hiddenStyleMarker, "true");
      return true;
    }
    case "show": {
      const hit = resolveFingerprint(op.target);
      if (!hit) return false;
      capturePristineStyle(hit.el);
      (hit.el as HTMLElement).style.removeProperty("display");
      hit.el.removeAttribute(hiddenStyleMarker);
      return true;
    }
    case "pin": {
      const hit = resolveFingerprint(op.target);
      if (!hit) return false;
      capturePristineStyle(hit.el);
      capturePristineClass(hit.el);
      pinElement(hit.el as HTMLElement, op.dockPosition, op.customXY);
      return true;
    }
    case "unpin": {
      const hit = resolveFingerprint(op.target);
      if (!hit) return false;
      capturePristineStyle(hit.el);
      capturePristineClass(hit.el);
      unpinElement(hit.el as HTMLElement);
      return true;
    }
    case "text": {
      const hit = resolveFingerprint(op.target);
      if (!hit) return false;
      capturePristineText(hit.el);
      hit.el.textContent = op.newText;
      return true;
    }
    case "style": {
      const hit = resolveFingerprint(op.target);
      if (!hit) return false;
      capturePristineStyle(hit.el);
      applyStyle(hit.el as HTMLElement, op.css as Record<string, string>);
      return true;
    }
    case "attr": {
      const hit = resolveFingerprint(op.target);
      if (!hit) return false;
      if (isDangerousAttribute(op.attr) || isDangerousAttributeValue(op.attr, op.value)) return false;
      capturePristineAttr(hit.el, op.attr);
      if (op.value === null) hit.el.removeAttribute(op.attr);
      else hit.el.setAttribute(op.attr, op.value);
      return true;
    }
    default:
      return false;
  }
}
