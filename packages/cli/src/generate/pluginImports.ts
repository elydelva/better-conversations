/**
 * Maps plugin names to their package import paths for schema generation.
 */
export const PLUGIN_PACKAGES: Record<string, string> = {
  sse: "@better-conversation/plugin-sse",
  history: "@better-conversation/plugin-history",
  presence: "@better-conversation/plugin-presence",
  "rate-limit": "@better-conversation/plugin-rate-limit",
};

export function getPluginImportPath(name: string): string {
  return PLUGIN_PACKAGES[name] ?? `@better-conversation/plugin-${name}`;
}

export function getPluginExportName(name: string): string {
  const map: Record<string, string> = {
    sse: "createSsePlugin",
    history: "createHistoryPlugin",
    presence: "createPresencePlugin",
    "rate-limit": "createRateLimitPlugin",
  };
  return (
    map[name] ?? `create${name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, "")}Plugin`
  );
}
