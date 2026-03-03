import type {
  Block,
  Chatter,
  Conversation,
  DatabaseAdapter,
  Participant,
} from "@better-conversation/core";
import { createAdapterHelpers } from "@better-conversation/core";
import { createUnsupportedPolicyAdapter } from "@better-conversation/core";

function partKey(cid: string, chid: string) {
  return `${cid}:${chid}`;
}

export function createInMemoryAdapter(): DatabaseAdapter {
  const helpers = createAdapterHelpers({ generateId: () => crypto.randomUUID() });
  const chatters = new Map<string, Chatter>();
  const conversations = new Map<string, Conversation>();
  const participants = new Map<string, Participant>();
  const blocks = new Map<string, Block>();
  return {
    chatters: {
      find: async (id) => chatters.get(id) ?? null,
      findByEntity: async (entityType, entityId) => {
        for (const c of chatters.values()) {
          if (c.entityType === entityType && c.entityId === entityId) return c;
        }
        return null;
      },
      list: async () => ({
        items: Array.from(chatters.values()),
        total: chatters.size,
        cursor: null,
        hasMore: false,
      }),
      create: async (data) => {
        const id = helpers.generateId();
        const now = new Date();
        const chatter: Chatter = {
          id,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl ?? null,
          entityType: data.entityType,
          entityId: data.entityId ?? null,
          metadata: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        chatters.set(id, chatter);
        return chatter;
      },
      update: async (id, data) => {
        const existing = chatters.get(id);
        if (!existing) throw new Error(`Chatter ${id} not found`);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        chatters.set(id, updated);
        return updated;
      },
    },
    conversations: {
      find: async (id) => conversations.get(id) ?? null,
      findByEntity: async () => [],
      list: async ({ chatterId }) => {
        const items = chatterId
          ? (Array.from(participants.values())
              .filter((p) => p.chatterId === chatterId && p.leftAt == null)
              .map((p) => conversations.get(p.conversationId))
              .filter(Boolean) as Conversation[])
          : Array.from(conversations.values());
        return { items, total: items.length, hasMore: false };
      },
      create: async (data) => {
        const id = helpers.generateId();
        const now = new Date();
        const conv: Conversation = {
          id,
          title: data.title ?? null,
          status: (data.status as Conversation["status"]) ?? "open",
          entityType: data.entityType ?? null,
          entityId: data.entityId ?? null,
          createdBy: data.createdBy,
          metadata: data.metadata ?? null,
          createdAt: now,
          updatedAt: now,
        };
        conversations.set(id, conv);
        for (const p of data.participants ?? []) {
          const pid = helpers.generateId();
          participants.set(partKey(id, p.chatterId), {
            id: pid,
            conversationId: id,
            chatterId: p.chatterId,
            role: p.role,
            joinedAt: now,
            leftAt: null,
            lastReadAt: null,
            metadata: null,
          });
        }
        return conv;
      },
      update: async (id, data) => {
        const existing = conversations.get(id);
        if (!existing) throw new Error(`Conversation ${id} not found`);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        conversations.set(id, updated);
        return updated;
      },
    },
    participants: {
      list: async (conversationId) =>
        Array.from(participants.values()).filter(
          (p) => p.conversationId === conversationId && p.leftAt == null
        ),
      find: async (conversationId, chatterId) =>
        Array.from(participants.values()).find(
          (p) =>
            p.conversationId === conversationId && p.chatterId === chatterId && p.leftAt == null
        ) ?? null,
      add: async (data) => {
        const id = helpers.generateId();
        const now = new Date();
        const p: Participant = {
          id,
          conversationId: data.conversationId,
          chatterId: data.chatterId,
          role: data.role,
          joinedAt: now,
          leftAt: null,
          lastReadAt: null,
          metadata: null,
        };
        participants.set(id, p);
        return p;
      },
      update: async (id, data) => {
        const p = participants.get(id);
        if (!p) throw new Error(`Participant ${id} not found`);
        const updated = { ...p, ...data };
        participants.set(id, updated);
        return updated;
      },
      remove: async (id) => {
        const p = participants.get(id);
        if (p) {
          participants.set(id, { ...p, leftAt: new Date() });
        }
      },
    },
    blocks: {
      find: async (id) => blocks.get(id) ?? null,
      list: async (filters) => {
        const items = Array.from(blocks.values()).filter(
          (b) => b.conversationId === filters.conversationId
        );
        return { items, total: items.length, hasMore: false };
      },
      create: async (data) => {
        const id = helpers.generateId();
        const now = new Date();
        const block: Block = {
          id,
          conversationId: data.conversationId,
          authorId: data.authorId,
          type: data.type,
          body: data.body ?? null,
          metadata: data.metadata ?? null,
          threadParentId: data.threadParentId ?? null,
          status: "published",
          refusalReason: null,
          flaggedAt: null,
          editedAt: null,
          createdAt: now,
        };
        blocks.set(id, block);
        return block;
      },
      update: async (id, data) => {
        const existing = blocks.get(id);
        if (!existing) throw new Error(`Block ${id} not found`);
        const updated = { ...existing, ...data } as Block;
        blocks.set(id, updated);
        return updated;
      },
      softDelete: async (id) => {
        blocks.delete(id);
      },
    },
    permissions: {
      check: async () => false,
      grant: async () => {},
      revoke: async () => {},
    },
    registries: {
      upsertBlock: async () => {},
      upsertRole: async () => {},
    },
    policies: createUnsupportedPolicyAdapter(),
  };
}
