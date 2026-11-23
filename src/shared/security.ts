const DANGEROUS_ATTR_NAMES = new Set([
  "srcdoc",
  "formaction",
  "xlink:href",
  "style"
]);

export function isDangerousAttribute(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith("on")) return true;
  return DANGEROUS_ATTR_NAMES.has(lower);
}

const URL_BEARING_ATTRS = new Set(["href", "src", "action", "formaction", "data"]);

export function isDangerousAttributeValue(name: string, value: string | null): boolean {
  if (value === null) return false;
  if (!URL_BEARING_ATTRS.has(name.toLowerCase())) return false;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  return normalized.startsWith("javascript:") || normalized.startsWith("data:text/html");
}

export function sanitizeStyleValue(value: string): string {
  if (/javascript\s*:/i.test(value) || /expression\s*\(/i.test(value) || /-moz-binding/i.test(value)) {
    return "";
  }
  return value;
}
