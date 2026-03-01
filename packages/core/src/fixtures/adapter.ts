import type { DatabaseAdapter } from "../adapter/index.js";
import { createMockBlock } from "./block.js";
import { createMockChatter } from "./chatter.js";
import { createMockConversation } from "./conversation.js";
import { createMockParticipant } from "./participant.js";

export function createMockAdapter(overrides: Partial<DatabaseAdapter> = {}): DatabaseAdapter {
  return {
    chatters: {
      find: async () => null,
      findByEntity: async () => null,
      create: async () => createMockChatter(),
      update: async () => createMockChatter(),
    },
    conversations: {
      find: async () => null,
      findByEntity: async () => [],
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockConversation(),
      update: async () => createMockConversation(),
    },
    participants: {
      list: async () => [],
      find: async () => null,
      add: async () => createMockParticipant(),
      update: async () => createMockParticipant(),
      remove: async () => {},
    },
    blocks: {
      find: async () => null,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
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
    ...overrides,
  };
}
