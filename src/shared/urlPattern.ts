export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function defaultPatternFor(url: string): string {
  return domainOf(url);
}

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

export function urlMatchesPattern(url: string, pattern: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const full = `${host}${u.pathname}`;

    if (!pattern.includes("/")) {
      return host === pattern;
    }
    return patternToRegExp(pattern).test(full) || patternToRegExp(pattern).test(host + u.pathname);
  } catch {
    return false;
  }
}

export function bestPatternMatch(url: string, knownPatterns: string[]): string {
  const host = domainOf(url);
  const candidates = knownPatterns.filter((p) => urlMatchesPattern(url, p));
  if (candidates.length === 0) return host;
  return candidates.sort((a, b) => b.length - a.length)[0];
}
