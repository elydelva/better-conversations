import type { ConversationStatus } from "./value-objects.js";

export interface Conversation {
  id: string;
  title: string | null;
  status: ConversationStatus;
  entityType: string | null;
  entityId: string | null;
  createdBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationInput {
  title?: string | null;
  status?: ConversationStatus;
  entityType?: string | null;
  entityId?: string | null;
  createdBy: string;
  metadata?: Record<string, unknown> | null;
  participants?: Array<{ chatterId: string; role: string }>;
}
