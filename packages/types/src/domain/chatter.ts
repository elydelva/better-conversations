export interface Chatter {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatterInput {
  displayName: string;
  avatarUrl?: string | null;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}
