export type DropPosition = "before" | "after" | "inside";

export interface DropTarget {
  element: Element;
  position: DropPosition;
}

const INDICATOR_ID = "fe-drop-indicator";

function getIndicator(): HTMLElement {
  let el = document.getElementById(INDICATOR_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = INDICATOR_ID;
    el.className = "fe-drop-indicator";
    document.body.appendChild(el);
  }
  return el;
}

export function hideIndicator(): void {
  const el = document.getElementById(INDICATOR_ID);
  if (el) el.style.display = "none";
}

export function computeDropTarget(hovered: Element, clientX: number, clientY: number): DropTarget {
  const rect = hovered.getBoundingClientRect();
  const relY = (clientY - rect.top) / rect.height;
  const hasChildren = hovered.children.length > 0;

  if (relY < 0.25) return { element: hovered, position: "before" };
  if (relY > 0.75) return { element: hovered, position: "after" };
  return { element: hovered, position: hasChildren ? "inside" : "after" };
}

export function showIndicatorFor(target: DropTarget): void {
  const indicator = getIndicator();
  const rect = target.element.getBoundingClientRect();
  indicator.style.display = "block";

  if (target.position === "inside") {
    indicator.className = "fe-drop-indicator fe-drop-indicator--box";
    indicator.style.top = `${rect.top + window.scrollY}px`;
    indicator.style.left = `${rect.left + window.scrollX}px`;
    indicator.style.width = `${rect.width}px`;
    indicator.style.height = `${rect.height}px`;
  } else {
    const y = target.position === "before" ? rect.top : rect.bottom;
    indicator.className = "fe-drop-indicator fe-drop-indicator--line";
    indicator.style.top = `${y + window.scrollY}px`;
    indicator.style.left = `${rect.left + window.scrollX}px`;
    indicator.style.width = `${rect.width}px`;
    indicator.style.height = "0px";
  }
}

export function performMove(dragged: Element, target: DropTarget): void {
  if (target.position === "inside") {
    target.element.appendChild(dragged);
  } else if (target.position === "before") {
    target.element.parentElement?.insertBefore(dragged, target.element);
  } else {
    target.element.parentElement?.insertBefore(dragged, target.element.nextSibling);
  }
}

export function startElementDrag(
  dragged: Element,
  onDrop: (target: DropTarget | null) => void
): void {
  dragged.classList.add("fe-dragging");
  let currentTarget: DropTarget | null = null;

  function onPointerMove(e: PointerEvent) {
    const under = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find(
        (el) =>
          el !== dragged &&
          !dragged.contains(el) &&
          !el.closest("#fe-toolbar-root, #fe-style-panel-root, #fe-edit-overlay") &&
          el.nodeType === 1
      );
    if (!under || under === document.documentElement || under === document.body) {
      hideIndicator();
      currentTarget = null;
      return;
    }
    currentTarget = computeDropTarget(under, e.clientX, e.clientY);
    showIndicatorFor(currentTarget);
  }

  function onPointerUp() {
    cleanup();
    onDrop(currentTarget);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      cleanup();
      onDrop(null);
    }
  }

  function cleanup() {
    dragged.classList.remove("fe-dragging");
    hideIndicator();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("keydown", onKeyDown);
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
}
