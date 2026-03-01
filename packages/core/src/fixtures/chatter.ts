import type { Chatter } from "../types/index.js";

export function createMockChatter(overrides: Partial<Chatter> = {}): Chatter {
  return {
    id: "chatter_1",
    displayName: "Test User",
    avatarUrl: null,
    entityType: "user",
    entityId: null,
    metadata: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
