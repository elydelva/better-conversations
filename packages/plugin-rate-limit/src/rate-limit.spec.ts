import { describe, expect, test } from "bun:test";
import { betterConversation } from "@better-conversation/core";
import {
  createMockAdapter,
  createMockBlock,
  createMockChatter,
  createMockConversation,
  createMockParticipant,
} from "@better-conversation/core/fixtures";
import { BlockRateLimitError } from "@better-conversation/errors";
import { createRateLimitPlugin } from "./index.js";

describe("plugin-rate-limit", () => {
  test("plugin exposes name and hooks", () => {
    const plugin = createRateLimitPlugin({ limit: 10 });
    expect(plugin.name).toBe("rate-limit");
    expect(plugin.hooks?.onBlockBeforeSend).toBeDefined();
    expect(plugin.createServices).toBeDefined();
  });

  test("hook rejects when limit exceeded", async () => {
    const conv = createMockConversation({ id: "conv_1" });
    const chatter = createMockChatter({ id: "chatter_1" });
    const block = createMockBlock({
      id: "blk_1",
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
    });
    const adapter = createMockAdapter({
      conversations: {
        find: async () => conv,
        findByEntity: async () => [],
        list: async () => ({ items: [conv], total: 1, hasMore: false }),
        create: async () => conv,
        update: async () => conv,
      },
      chatters: {
        find: async () => chatter,
        findByEntity: async () => null,
        list: async () => ({ items: [chatter], total: 1, cursor: null, hasMore: false }),
        create: async () => chatter,
        update: async () => chatter,
      },
      participants: {
        list: async () => [createMockParticipant()],
        find: async () => createMockParticipant(),
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
      plugins: [createRateLimitPlugin({ limit: 2, windowMs: 60_000 })],
    });

    await engine.blocks.send({
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
      body: null,
      metadata: null,
      threadParentId: null,
    });
    await engine.blocks.send({
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
      body: null,
      metadata: null,
      threadParentId: null,
    });

    await expect(
      engine.blocks.send({
        conversationId: "conv_1",
        authorId: "chatter_1",
        type: "text",
        body: null,
        metadata: null,
        threadParentId: null,
      })
    ).rejects.toThrow(BlockRateLimitError);
  });
});
