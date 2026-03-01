export interface AuditEntry {
  id: string;
  event: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}

export interface AuditQueryFilters {
  event?: string;
  entityType?: string;
  entityId?: string;
  since?: Date;
  limit?: number;
}

export interface AuditStore {
  append(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void>;
  query?(filters: AuditQueryFilters): Promise<AuditEntry[]>;
}
