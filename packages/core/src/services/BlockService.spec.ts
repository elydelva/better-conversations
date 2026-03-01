import { describe, expect, test } from "bun:test";
import {
  BlockNotFoundError,
  BlockRateLimitError,
  BlockRefusedError,
  ChatterNotFoundError,
  ConversationNotFoundError,
} from "@better-conversation/errors";
import {
  createMockAdapter,
  createMockBlock,
  createMockChatter,
  createMockConversation,
  createMockParticipant,
} from "../fixtures/index.js";
import type { BlockBeforeSendCtx } from "../hooks/BlockBeforeSend.js";
import type { BlockDeleteCtx } from "../hooks/BlockDelete.js";
import { defaultRoleRegistry } from "../registry/defaultRoleRegistry.js";
import { BlockService } from "./BlockService.js";

describe("BlockService", () => {
  const baseAdapter = createMockAdapter({
    conversations: {
      find: async () => createMockConversation(),
      findByEntity: async () => [],
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockConversation(),
      update: async () => createMockConversation(),
    },
    chatters: {
      find: async () => createMockChatter(),
      findByEntity: async () => null,
      create: async () => createMockChatter(),
      update: async () => createMockChatter(),
    },
    participants: {
      list: async () => [createMockParticipant()],
      find: async () => createMockParticipant(),
      add: async () => createMockParticipant(),
      update: async () => createMockParticipant(),
      remove: async () => {},
    },
  });

  test("send throws BlockRefusedError when hook returns refuse", async () => {
    const blocks = {
      find: async () => createMockBlock(),
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const adapter = { ...baseAdapter, blocks };
    const service = new BlockService({
      adapter,
      hooks: {
        onBlockBeforeSend: async (_ctx: BlockBeforeSendCtx, outcomes) =>
          outcomes.refuse("not allowed"),
      },
    });

    await expect(
      service.send({
        conversationId: "conv_1",
        authorId: "chatter_1",
        type: "text",
      })
    ).rejects.toThrow(BlockRefusedError);
  });

  test("send creates block with flaggedAt when hook returns flag", async () => {
    const createdBlock = createMockBlock({ id: "b1" });
    let updatedWithFlaggedAt: Date | null = null;
    const blocks = {
      find: async () => null,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createdBlock,
      update: async (_id: string, data: { flaggedAt?: Date }) => {
        updatedWithFlaggedAt = data.flaggedAt ?? null;
        return { ...createdBlock, flaggedAt: updatedWithFlaggedAt };
      },
      softDelete: async () => {},
    };
    const adapter = { ...baseAdapter, blocks };
    const service = new BlockService({
      adapter,
      hooks: {
        onBlockBeforeSend: async (_ctx: BlockBeforeSendCtx, outcomes) =>
          outcomes.flag("suspicious"),
      },
    });

    await service.send({
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
    });
    expect(updatedWithFlaggedAt).toBeInstanceOf(Date);
  });

  test("send uses transformed data when hook returns transform", async () => {
    const transformedBlock = createMockBlock({
      id: "b1",
      body: "transformed body",
    });
    let createPayload: Record<string, unknown> = {};
    const blocks = {
      find: async () => null,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async (data: Record<string, unknown>) => {
        createPayload = data;
        return { ...createMockBlock(), ...data, id: "b1" };
      },
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const adapter = { ...baseAdapter, blocks };
    const service = new BlockService({
      adapter,
      hooks: {
        onBlockBeforeSend: async (ctx: BlockBeforeSendCtx, outcomes) =>
          outcomes.transform({
            ...ctx.block,
            conversationId: "conv_1",
            authorId: "chatter_1",
            type: "text",
            body: "transformed body",
          }),
      },
    });

    await service.send({
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
    });
    expect(createPayload.body).toBe("transformed body");
  });

  test("delete throws when block not found", async () => {
    const blocks = {
      find: async () => null,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const adapter = { ...baseAdapter, blocks };
    const service = new BlockService({ adapter });

    await expect(service.delete("nonexistent")).rejects.toThrow(BlockNotFoundError);
  });

  test("delete runs onBlockBeforeDelete and throws on refuse", async () => {
    const block = createMockBlock({ id: "b1" });
    const blocks = {
      find: async () => block,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const adapter = { ...baseAdapter, blocks };
    const service = new BlockService({
      adapter,
      hooks: {
        onBlockBeforeDelete: async (_ctx: BlockDeleteCtx, outcomes) =>
          outcomes.refuse("cannot delete"),
      },
    });

    await expect(service.delete("b1")).rejects.toThrow(BlockRefusedError);
  });

  test("send throws ConversationNotFoundError when conversation not found", async () => {
    const adapter = createMockAdapter({
      conversations: {
        find: async () => null,
        findByEntity: async () => [],
        list: async () => ({ items: [], total: 0, hasMore: false }),
        create: async () => createMockConversation(),
        update: async () => createMockConversation(),
      },
      chatters: baseAdapter.chatters,
      participants: baseAdapter.participants,
      blocks: baseAdapter.blocks,
      permissions: baseAdapter.permissions,
    });
    const service = new BlockService({ adapter });

    await expect(
      service.send({
        conversationId: "conv_missing",
        authorId: "chatter_1",
        type: "text",
      })
    ).rejects.toThrow(ConversationNotFoundError);
  });

  test("send throws BlockRefusedError when policy is readOnly", async () => {
    const readOnlyAdapter = {
      ...baseAdapter,
      participants: {
        list: async () => [],
        find: async () => createMockParticipant({ role: "observer" }),
        add: async () => createMockParticipant(),
        update: async () => createMockParticipant(),
        remove: async () => {},
      },
    };
    const policyService = new (await import("./PolicyService.js")).PolicyService({
      adapter: readOnlyAdapter,
      roleRegistry: defaultRoleRegistry,
    });
    const service = new BlockService({
      adapter: readOnlyAdapter,
      policyService,
    });
    await expect(
      service.send({
        conversationId: "conv_1",
        authorId: "chatter_1",
        type: "text",
      })
    ).rejects.toThrow(BlockRefusedError);
  });

  test("send throws BlockRateLimitError when maxBlocksPerMinute exceeded", async () => {
    const rateLimitAdapter = {
      ...baseAdapter,
      participants: {
        list: async () => [],
        find: async () => createMockParticipant({ role: "member" }),
        add: async () => createMockParticipant(),
        update: async () => createMockParticipant(),
        remove: async () => {},
      },
      blocks: {
        find: async () => null,
        list: async () => ({
          items: Array(20).fill(createMockBlock()),
          total: 20,
          hasMore: false,
        }),
        create: async () => createMockBlock(),
        update: async () => createMockBlock(),
        softDelete: async () => {},
      },
    };
    const policyService = new (await import("./PolicyService.js")).PolicyService({
      adapter: rateLimitAdapter,
      roleRegistry: defaultRoleRegistry,
    });
    const service = new BlockService({
      adapter: rateLimitAdapter,
      policyService,
    });
    await expect(
      service.send({
        conversationId: "conv_1",
        authorId: "chatter_1",
        type: "text",
      })
    ).rejects.toThrow(BlockRateLimitError);
  });

  test("delete throws BlockRefusedError when block is already deleted", async () => {
    const block = createMockBlock({ id: "b1", status: "deleted" });
    const blocks = {
      find: async () => block,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const adapter = { ...baseAdapter, blocks };
    const service = new BlockService({ adapter });

    await expect(service.delete("b1")).rejects.toThrow(BlockRefusedError);
  });

  test("delete throws BlockRefusedError when canDeleteOwnBlocks is false", async () => {
    const block = createMockBlock({ id: "b1" });
    const blocks = {
      find: async () => block,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const observerRole = defaultRoleRegistry.observer;
    if (!observerRole) throw new Error("Observer role must exist in default registry");
    const adapter = {
      ...baseAdapter,
      blocks,
      participants: {
        ...baseAdapter.participants,
        find: async () => createMockParticipant({ role: "observer" }),
      },
    };
    const policyService = new (await import("./PolicyService.js")).PolicyService({
      adapter,
      roleRegistry: {
        ...defaultRoleRegistry,
        observer: {
          ...observerRole,
          policy: { ...observerRole.policy, canDeleteOwnBlocks: false },
        },
      },
    });
    const service = new BlockService({ adapter, policyService });

    await expect(service.delete("b1")).rejects.toThrow(BlockRefusedError);
  });

  test("updateMeta throws BlockRefusedError when editWindowSeconds exceeded", async () => {
    const oldDate = new Date(Date.now() - 400_000); // > 300s ago
    const block = createMockBlock({ id: "b1", createdAt: oldDate });
    const blocks = {
      find: async () => block,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const policyService = new (await import("./PolicyService.js")).PolicyService({
      adapter: { ...baseAdapter, blocks },
      roleRegistry: defaultRoleRegistry,
    });
    const service = new BlockService({
      adapter: { ...baseAdapter, blocks },
      policyService,
    });

    await expect(service.updateMeta("b1", { body: "updated" })).rejects.toThrow(BlockRefusedError);
  });

  test("updateMeta throws BlockRefusedError when canEditOwnBlocks is false", async () => {
    const block = createMockBlock({ id: "b1" });
    const blocks = {
      find: async () => block,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    };
    const adapter = {
      ...baseAdapter,
      blocks,
      participants: {
        ...baseAdapter.participants,
        find: async () => createMockParticipant({ role: "bot" }),
      },
    };
    const policyService = new (await import("./PolicyService.js")).PolicyService({
      adapter,
      roleRegistry: defaultRoleRegistry,
    });
    const service = new BlockService({ adapter, policyService });

    await expect(service.updateMeta("b1", { body: "updated" })).rejects.toThrow(BlockRefusedError);
  });

  test("send throws ChatterNotFoundError when author not found", async () => {
    const adapter = createMockAdapter({
      conversations: baseAdapter.conversations,
      chatters: {
        find: async () => null,
        findByEntity: async () => null,
        create: async () => createMockChatter(),
        update: async () => createMockChatter(),
      },
      participants: baseAdapter.participants,
      blocks: baseAdapter.blocks,
      permissions: baseAdapter.permissions,
    });
    const service = new BlockService({ adapter });

    await expect(
      service.send({
        conversationId: "conv_1",
        authorId: "chatter_missing",
        type: "text",
      })
    ).rejects.toThrow(ChatterNotFoundError);
  });
});
