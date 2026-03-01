import { existsSync } from "node:fs";
import { join } from "node:path";

const CONFIG_NAMES = ["conversation.ts", "conv.ts"] as const;

const SEARCH_DIRS = [
  ".",
  "lib",
  "utils",
  "src",
  "src/lib",
  "src/utils",
  "app",
  "app/lib",
  "server",
];

export interface FindConfigResult {
  path: string;
  cwd: string;
}

/**
 * Searches for conversation.ts or conv.ts in standard locations.
 */
export function findConfig(cwd: string, customPath?: string): FindConfigResult | null {
  if (customPath) {
    const resolved = join(cwd, customPath);
    if (existsSync(resolved)) {
      return { path: resolved, cwd };
    }
    return null;
  }

  for (const dir of SEARCH_DIRS) {
    const fullDir = join(cwd, dir);
    for (const name of CONFIG_NAMES) {
      const candidate = join(fullDir, name);
      if (existsSync(candidate)) {
        return { path: candidate, cwd };
      }
    }
  }
  return null;
}
