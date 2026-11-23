export const PINNED_CLASS = "fe-pinned";

export function pinElement(
  el: HTMLElement,
  dock: "top" | "bottom" | "left" | "right" | "custom",
  customXY?: { x: number; y: number }
): void {
  el.classList.add(PINNED_CLASS);
  el.style.setProperty("position", "fixed", "important");
  el.style.setProperty("z-index", "2147483000", "important");
  el.style.removeProperty("top");
  el.style.removeProperty("bottom");
  el.style.removeProperty("left");
  el.style.removeProperty("right");

  switch (dock) {
    case "top":
      el.style.setProperty("top", "8px", "important");
      el.style.setProperty("left", "50%", "important");
      el.style.setProperty("transform", "translateX(-50%)", "important");
      break;
    case "bottom":
      el.style.setProperty("bottom", "8px", "important");
      el.style.setProperty("left", "50%", "important");
      el.style.setProperty("transform", "translateX(-50%)", "important");
      break;
    case "left":
      el.style.setProperty("left", "8px", "important");
      el.style.setProperty("top", "50%", "important");
      el.style.setProperty("transform", "translateY(-50%)", "important");
      break;
    case "right":
      el.style.setProperty("right", "8px", "important");
      el.style.setProperty("top", "50%", "important");
      el.style.setProperty("transform", "translateY(-50%)", "important");
      break;
    case "custom":
      if (customXY) {
        el.style.setProperty("left", `${customXY.x}px`, "important");
        el.style.setProperty("top", `${customXY.y}px`, "important");
      }
      break;
  }
}

export function unpinElement(el: HTMLElement): void {
  el.classList.remove(PINNED_CLASS);
  el.style.removeProperty("position");
  el.style.removeProperty("z-index");
  el.style.removeProperty("top");
  el.style.removeProperty("bottom");
  el.style.removeProperty("left");
  el.style.removeProperty("right");
  el.style.removeProperty("transform");
}
