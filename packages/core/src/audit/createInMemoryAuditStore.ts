import type { AuditEntry, AuditStore } from "./AuditStore.interface.js";

export function createInMemoryAuditStore(): AuditStore & { entries: AuditEntry[] } {
  const entries: AuditEntry[] = [];
  return {
    entries,
    async append(entry) {
      entries.push({
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      });
    },
    async query(filters = {}) {
      let items = [...entries];
      if (filters.event) items = items.filter((e) => e.event === filters.event);
      if (filters.entityType) items = items.filter((e) => e.entityType === filters.entityType);
      if (filters.entityId) items = items.filter((e) => e.entityId === filters.entityId);
      if (filters.since) {
        const since = filters.since;
        items = items.filter((e) => e.timestamp >= since);
      }
      items = items.reverse();
      if (filters.limit) items = items.slice(0, filters.limit);
      return items;
    },
  };
}
