import type {
  BlockAfterSendCtx,
  ConversationAfterCreateCtx,
  ConversationHooks,
} from "@better-conversation/core";

export interface AuditEntry {
  id: string;
  event: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}

export interface AuditStore {
  append(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void>;
  query?(filters: {
    event?: string;
    entityType?: string;
    entityId?: string;
    since?: Date;
    limit?: number;
  }): Promise<AuditEntry[]>;
}

function createInMemoryAuditStore(): AuditStore & { entries: AuditEntry[] } {
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
      if (filters.limit) items = items.slice(0, filters.limit);
      return items.reverse();
    },
  };
}

export interface AuditPluginOptions {
  store?: AuditStore;
}

/**
 * Audit plugin — logs all mutations to an immutable journal.
 * Add the returned hooks to your ConversationConfig.hooks.
 *
 * @example
 * const audit = createAuditPlugin();
 * betterConversation({
 *   adapter,
 *   hooks: {
 *     onBlockAfterSend: composeHooks(audit.hooks.onBlockAfterSend, myHook),
 *     ...
 *   },
 * });
 */
export function createAuditPlugin(options?: AuditPluginOptions): {
  name: string;
  hooks: ConversationHooks;
  store: AuditStore;
} {
  const store = options?.store ?? createInMemoryAuditStore();

  const hooks: ConversationHooks = {
    onBlockAfterSend: async (ctx: BlockAfterSendCtx) => {
      await store.append({
        event: "block:created",
        entityType: "block",
        entityId: ctx.block.id,
        payload: {
          conversationId: ctx.block.conversationId,
          authorId: ctx.block.authorId,
          type: ctx.block.type,
          body: ctx.block.body,
          metadata: ctx.block.metadata,
        },
      });
    },
    onConversationAfterCreate: async (ctx: ConversationAfterCreateCtx) => {
      await store.append({
        event: "conversation:created",
        entityType: "conversation",
        entityId: ctx.conversation.id,
        payload: {
          createdBy: ctx.conversation.createdBy,
          title: ctx.conversation.title,
          status: ctx.conversation.status,
        },
      });
    },
  };

  return {
    name: "audit",
    hooks,
    store,
  };
}

/** @deprecated Use createAuditPlugin instead */
export const auditPlugin = "audit-plugin-placeholder";
