import type { BlockStatus, ConversationStatus } from "./value-objects.js";

export interface Paginated<T> {
  items: T[];
  total: number;
  cursor?: string | null;
  hasMore?: boolean;
}

export interface ConversationFilters {
  entityType?: string;
  entityId?: string;
  status?: ConversationStatus;
  chatterId?: string;
  limit?: number;
  cursor?: string;
}

export interface BlockFilters {
  conversationId: string;
  authorId?: string;
  type?: string;
  status?: BlockStatus;
  threadParentId?: string | null;
  after?: Date;
  before?: Date;
  limit?: number;
  metadataFilter?: Record<string, unknown>;
}
