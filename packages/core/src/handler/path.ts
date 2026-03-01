export interface PathMatch {
  matches: boolean;
  params: Record<string, string>;
}

export function matchPath(pattern: string, path: string): PathMatch {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.replace(/^\//, "").split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    const v = pathParts[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = v ?? "";
    } else if (p !== v) {
      return { matches: false, params: {} };
    }
  }
  return { matches: true, params };
}
