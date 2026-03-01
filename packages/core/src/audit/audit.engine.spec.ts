import { describe, expect, test } from "bun:test";
import { createMockBlock } from "../fixtures/block.js";
import {
  createMockAdapter,
  createMockChatter,
  createMockConversation,
  createMockParticipant,
} from "../fixtures/index.js";
import { betterConversation, createInMemoryAuditStore } from "../index.js";

describe("audit merge hooks", () => {
  test("config.audit merges onBlockAfterSend and onConversationAfterCreate", async () => {
    const store = createInMemoryAuditStore();
    const conv = createMockConversation({ id: "conv_1" });
    const chatter = createMockChatter({ id: "chatter_1" });
    const block = createMockBlock({ id: "blk_1", conversationId: "conv_1", authorId: "chatter_1" });

    const adapter = createMockAdapter({
      conversations: {
        find: async () => conv,
        findByEntity: async () => [],
        list: async () => ({ items: [conv], total: 1, hasMore: false }),
        create: async (data) => ({ ...conv, ...data, id: "conv_1" }),
        update: async () => conv,
      },
      chatters: {
        find: async () => chatter,
        findByEntity: async () => null,
        create: async () => chatter,
        update: async () => chatter,
      },
      participants: {
        list: async () => [
          createMockParticipant({
            conversationId: "conv_1",
            chatterId: "chatter_1",
            leftAt: null,
          }),
        ],
        find: async () =>
          createMockParticipant({ conversationId: "conv_1", chatterId: "chatter_1" }),
        add: async () => createMockParticipant(),
        update: async () => createMockParticipant(),
        remove: async () => {},
      },
      blocks: {
        find: async () => null,
        list: async () => ({ items: [], total: 0, hasMore: false }),
        create: async () => block,
        update: async () => block,
        softDelete: async () => {},
      },
    });

    const engine = betterConversation({
      adapter,
      audit: { store },
    });

    await engine.conversations.create({
      title: "Test",
      status: "open",
      entityType: null,
      entityId: null,
      createdBy: "chatter_1",
      metadata: null,
    });

    const created = await engine.blocks.send({
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
      body: null,
      metadata: null,
      threadParentId: null,
    });

    const entries = store.entries;
    expect(entries.length).toBeGreaterThanOrEqual(2);

    const blockCreated = entries.find((e) => e.event === "block:created");
    expect(blockCreated).toBeDefined();
    expect(blockCreated?.entityType).toBe("block");
    expect(blockCreated?.entityId).toBe(created.id);
    expect(blockCreated?.payload).toMatchObject({
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
    });

    const convCreated = entries.find((e) => e.event === "conversation:created");
    expect(convCreated).toBeDefined();
    expect(convCreated?.entityType).toBe("conversation");
    expect(convCreated?.entityId).toBe("conv_1");
  });
});
