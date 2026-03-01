export interface AdapterOptions {
  tablePrefix?: string;
  generateId?: () => string;
}

export function createAdapterHelpers(options?: AdapterOptions) {
  const tablePrefix = options?.tablePrefix ?? "bc_";
  const generateId = options?.generateId ?? (() => crypto.randomUUID());
  const now = () => new Date();

  function ensureTimestamps<T extends Record<string, unknown>>(
    data: T,
    mode: "create" | "update"
  ): T & { createdAt?: Date; updatedAt?: Date } {
    const ts = now();
    if (mode === "create") {
      return { ...data, createdAt: ts, updatedAt: ts };
    }
    return { ...data, updatedAt: ts };
  }

  return { tablePrefix, generateId, now, ensureTimestamps };
}
