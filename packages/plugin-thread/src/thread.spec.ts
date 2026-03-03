import { describe, expect, mock, test } from "bun:test";
import type { BlockBeforeSendCtx, BlockOutcomes, ResolvedPolicy } from "@better-conversation/core";
import { BlockRefusedError } from "@better-conversation/errors";
import { createThreadPlugin } from "./index.js";

describe("Thread Plugin", () => {
  const mockOutcomes = {
    next: async () => ({ type: "next" }),
    refuse: async (reason: string, options: unknown) => ({
      type: "refuse",
      reason,
      options,
    }),
  } as unknown as BlockOutcomes;

  const mockAdapter = {
    blocks: {
      list: async () => ({ items: [], total: 0, hasMore: false }),
      find: async () => null,
    },
    // biome-ignore lint/suspicious/noExplicitAny: mocking adapter
  } as unknown as any;

  const baseCtx: Partial<BlockBeforeSendCtx> = {
    isThread: false,
    isFirstReply: false,
    resolvedPolicy: {
      threadsEnabled: true,
      threadClosed: false,
      maxThreadDepth: 1,
      maxThreadReplies: null,
    } as ResolvedPolicy,
    block: {
      conversationId: "conv_1",
      authorId: "chatter_1",
      type: "text",
      // biome-ignore lint/suspicious/noExplicitAny: partial block for testing
    } as any,
    adapter: mockAdapter,
  };

  test("plugin has correct name and version", () => {
    const plugin = createThreadPlugin();
    expect(plugin.name).toBe("thread");
    expect(plugin.version).toBe("1.0.0");
  });

  test("enforces threadsEnabled: false", async () => {
    const plugin = createThreadPlugin();
    const ctx = {
      ...baseCtx,
      isThread: true,
      resolvedPolicy: { ...baseCtx.resolvedPolicy, threadsEnabled: false },
    } as BlockBeforeSendCtx;

    await expect(plugin.hooks?.onBlockBeforeSend?.(ctx, mockOutcomes)).rejects.toThrow(
      "Threads are disabled in this conversation"
    );
  });

  test("enforces threadClosed: true", async () => {
    const plugin = createThreadPlugin();
    const ctx = {
      ...baseCtx,
      isThread: true,
      resolvedPolicy: { ...baseCtx.resolvedPolicy, threadClosed: true },
    } as BlockBeforeSendCtx;

    await expect(plugin.hooks?.onBlockBeforeSend?.(ctx, mockOutcomes)).rejects.toThrow(
      "Thread is closed"
    );
  });

  test("enforces maxThreadDepth: 0", async () => {
    const plugin = createThreadPlugin();
    const ctx = {
      ...baseCtx,
      isThread: true,
      resolvedPolicy: { ...baseCtx.resolvedPolicy, maxThreadDepth: 0 },
    } as BlockBeforeSendCtx;

    await expect(plugin.hooks?.onBlockBeforeSend?.(ctx, mockOutcomes)).rejects.toThrow(
      "Threads are not allowed"
    );
  });

  test("enforces maxThreadReplies", async () => {
    const plugin = createThreadPlugin();
    const adapterWithReplies = {
      blocks: {
        list: async () => ({ items: [{}, {}, {}], total: 3, hasMore: false }),
      },
      // biome-ignore lint/suspicious/noExplicitAny: mocking adapter with replies
    } as any;
    const ctx = {
      ...baseCtx,
      isThread: true,
      block: { ...baseCtx.block, threadParentId: "parent_1" },
      adapter: adapterWithReplies,
      resolvedPolicy: { ...baseCtx.resolvedPolicy, maxThreadReplies: 2 },
    } as BlockBeforeSendCtx;

    await expect(plugin.hooks?.onBlockBeforeSend?.(ctx, mockOutcomes)).rejects.toThrow(
      "Thread has reached maximum number of replies (2)"
    );
  });

  test("fires onThreadCreated when isFirstReply is true", async () => {
    const onThreadCreated = mock(async () => ({ type: "next" }));
    const mockEngine = {
      getHooks: () => ({ onThreadCreated }),
    };
    const parentBlock = { id: "parent_1" };
    const adapterWithParent = {
      blocks: {
        find: async () => parentBlock,
      },
      // biome-ignore lint/suspicious/noExplicitAny: mocking adapter with parent
    } as any;

    const plugin = createThreadPlugin();
    const ctx = {
      ...baseCtx,
      isThread: true,
      isFirstReply: true,
      block: { ...baseCtx.block, threadParentId: "parent_1" },
      engine: mockEngine,
      adapter: adapterWithParent,
      // biome-ignore lint/suspicious/noExplicitAny: complex mock context
    } as any;

    await plugin.hooks?.onBlockBeforeSend?.(ctx, mockOutcomes);
    expect(onThreadCreated).toHaveBeenCalled();
    // biome-ignore lint/suspicious/noExplicitAny: bun mock calls typing
    const [callArgs] = (onThreadCreated as any).mock.calls[0];
    expect(callArgs.parentBlock).toBe(parentBlock);
  });

  test("allows sending when everything is fine", async () => {
    const plugin = createThreadPlugin();
    const ctx = {
      ...baseCtx,
      isThread: true,
      block: { ...baseCtx.block, threadParentId: "parent_1" },
    } as BlockBeforeSendCtx;

    const result = await plugin.hooks?.onBlockBeforeSend?.(ctx, mockOutcomes);
    expect(result?.type).toBe("next");
  });
});
