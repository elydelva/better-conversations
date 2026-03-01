import type { DatabaseAdapter } from "@better-conversation/core";
import { runConformanceTests } from "./index.js";

function createMockAdapter(): DatabaseAdapter {
  const chatters = new Map<string, Awaited<ReturnType<DatabaseAdapter["chatters"]["create"]>>>();
  const conversations = new Map<
    string,
    Awaited<ReturnType<DatabaseAdapter["conversations"]["create"]>>
  >();
  const participants = new Map<
    string,
    Awaited<ReturnType<DatabaseAdapter["participants"]["add"]>>
  >();
  const blocks = new Map<string, Awaited<ReturnType<DatabaseAdapter["blocks"]["create"]>>>();

  return {
    chatters: {
      find: async (id) => chatters.get(id) ?? null,
      findByEntity: async (type, entityId) =>
        Array.from(chatters.values()).find(
          (c) => c.entityType === type && c.entityId === entityId
        ) ?? null,
      create: async (d) => {
        const id = `ch_${chatters.size + 1}`;
        const chatter = {
          id,
          displayName: d.displayName,
          entityType: d.entityType,
          entityId: d.entityId ?? null,
          avatarUrl: d.avatarUrl ?? null,
          metadata: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        chatters.set(id, chatter);
        return chatter;
      },
      update: async (id, d) => {
        const existing = chatters.get(id);
        if (!existing) throw new Error("NotFound");
        const updated = { ...existing, ...d, updatedAt: new Date() };
        chatters.set(id, updated);
        return updated;
      },
    },
    conversations: {
      find: async (id) => conversations.get(id) ?? null,
      findByEntity: async () => [],
      list: async () => ({ items: Array.from(conversations.values()), total: conversations.size }),
      create: async (d) => {
        const id = `c_${conversations.size + 1}`;
        const conv = {
          id,
          title: d.title ?? null,
          status: "open" as const,
          entityType: d.entityType ?? null,
          entityId: d.entityId ?? null,
          createdBy: d.createdBy,
          metadata: d.metadata ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        conversations.set(id, conv);
        return conv;
      },
      update: async (id, d) => {
        const existing = conversations.get(id);
        if (!existing) throw new Error("NotFound");
        const updated = { ...existing, ...d, updatedAt: new Date() };
        conversations.set(id, updated);
        return updated;
      },
    },
    participants: {
      list: async (convId) =>
        Array.from(participants.values()).filter((p) => p.conversationId === convId),
      find: async (convId, chatterId) =>
        Array.from(participants.values()).find(
          (p) => p.conversationId === convId && p.chatterId === chatterId
        ) ?? null,
      add: async (d) => {
        const id = `p_${participants.size + 1}`;
        const p = {
          id,
          conversationId: d.conversationId,
          chatterId: d.chatterId,
          role: d.role,
          joinedAt: new Date(),
          leftAt: null,
          lastReadAt: null,
          metadata: null,
        };
        participants.set(id, p);
        return p;
      },
      update: async () => ({
        id: "p1",
        conversationId: "c1",
        chatterId: "ch1",
        role: "member",
        joinedAt: new Date(),
        leftAt: null,
        lastReadAt: null,
        metadata: null,
      }),
      remove: async () => {},
    },
    blocks: {
      find: async (id) => blocks.get(id) ?? null,
      list: async (f) => {
        const items = Array.from(blocks.values()).filter(
          (b) => b.conversationId === f.conversationId
        );
        return { items, total: items.length, hasMore: false };
      },
      create: async (d) => {
        const id = `b_${blocks.size + 1}`;
        const block = {
          id,
          conversationId: d.conversationId,
          authorId: d.authorId,
          type: d.type,
          body: d.body ?? null,
          metadata: d.metadata ?? null,
          threadParentId: d.threadParentId ?? null,
          status: "published" as const,
          refusalReason: null,
          flaggedAt: null,
          editedAt: null,
          createdAt: new Date(),
        };
        blocks.set(id, block);
        return block;
      },
      update: async () => ({
        id: "b1",
        conversationId: "c1",
        authorId: "ch1",
        type: "text",
        body: null,
        metadata: null,
        threadParentId: null,
        status: "published",
        refusalReason: null,
        flaggedAt: null,
        editedAt: null,
        createdAt: new Date(),
      }),
      softDelete: async () => {},
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
    policies: {
      find: async () => null,
      upsert: async () => {},
      delete: async () => {},
    },
  };
}

describe("Conformance suite", () => {
  test("runConformanceTests exports a function", () => {
    expect(typeof runConformanceTests).toBe("function");
  });
});

describe("Mock adapter conformance", () => {
  runConformanceTests({ adapter: createMockAdapter() });
});
