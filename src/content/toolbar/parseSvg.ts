const parser = new DOMParser();

export function parseSvg(svgMarkup: string): SVGElement {
  const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = doc.documentElement;
  return svg as unknown as SVGElement;
}

export function setSvgIcon(container: Element, svgMarkup: string): void {
  const node = parseSvg(svgMarkup).cloneNode(true);
  container.replaceChildren(node);
}
