import type { Block } from "../types/index.js";

export function createMockBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "block_1",
    conversationId: "conv_1",
    authorId: "chatter_1",
    type: "text",
    body: null,
    metadata: null,
    threadParentId: null,
    status: "published",
    refusalReason: null,
    flaggedAt: null,
    editedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}
