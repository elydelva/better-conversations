/**
 * Query key factories for TanStack Query.
 * Used for cache invalidation and hierarchical queries.
 */
export const queryKeys = {
  chatters: {
    all: ["chatters"] as const,
    list: (params?: { limit?: number; cursor?: string }) =>
      ["chatters", { limit: params?.limit, cursor: params?.cursor }] as const,
    detail: (chatterId: string) => ["chatters", chatterId] as const,
    conversations: (chatterId: string, params?: { limit?: number; cursor?: string }) =>
      ["chatters", chatterId, "conversations", params] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    list: (params?: {
      entityType?: string;
      entityId?: string;
      limit?: number;
      cursor?: string;
    }) => ["conversations", params] as const,
    detail: (conversationId: string) => ["conversations", conversationId] as const,
    blocks: (
      conversationId: string,
      params?: { limit?: number; before?: string; after?: string; threadParentId?: string }
    ) => ["conversations", conversationId, "blocks", params] as const,
    participants: (conversationId: string) =>
      ["conversations", conversationId, "participants"] as const,
  },
  policies: {
    resolve: (chatterId: string, conversationId?: string, threadParentBlockId?: string) =>
      ["policies", chatterId, conversationId, threadParentBlockId] as const,
  },
} as const;
