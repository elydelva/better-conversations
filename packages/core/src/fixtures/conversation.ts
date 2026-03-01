import type { Conversation } from "../types/index.js";

export function createMockConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv_1",
    title: null,
    status: "open",
    entityType: null,
    entityId: null,
    createdBy: "chatter_1",
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
