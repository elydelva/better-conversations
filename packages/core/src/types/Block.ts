import type { BlockStatus } from "./value-objects.js";

export interface Block {
  id: string;
  conversationId: string;
  authorId: string;
  type: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  threadParentId: string | null;
  status: BlockStatus;
  refusalReason: string | null;
  flaggedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
}

export interface BlockInput {
  conversationId: string;
  authorId: string;
  type: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  threadParentId?: string | null;
}
