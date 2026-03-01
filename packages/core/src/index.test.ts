import { expect, test } from "bun:test";
import {
  betterConversation,
  createBlock,
  createRole,
  defaultBlockRegistry,
  defaultRoleRegistry,
  version,
} from "./index.js";
import type {
  Block,
  Chatter,
  ChatterInput,
  Conversation,
  DatabaseAdapter,
  Participant,
} from "./index.js";

function createMockConversation(overrides: Partial<Conversation> = {}): Conversation {
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

function createMockParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: "part_1",
    conversationId: "conv_1",
    chatterId: "chatter_1",
    role: "member",
    joinedAt: new Date(),
    leftAt: null,
    lastReadAt: null,
    metadata: null,
    ...overrides,
  };
}

function createMockBlock(overrides: Partial<Block> = {}): Block {
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

function createMockAdapter(): DatabaseAdapter {
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
      list: async () => ({ items: [], total: 0 }),
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
      list: async () => ({ items: [], total: 0 }),
      create: async () => createMockBlock(),
      update: async () => createMockBlock(),
      softDelete: async () => {},
    },
    permissions: {
      check: async () => false,
      grant: async () => {},
      revoke: async () => {},
    },
  };
}

function createMockChatter(overrides: Partial<Chatter> = {}): Chatter {
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

test("core exports version", () => {
  expect(version).toBe("0.0.0");
});

test("betterConversation returns engine with all services", () => {
  const engine = betterConversation({ adapter: createMockAdapter() });

  expect(engine).toBeDefined();
  expect(engine.chatters).toBeDefined();
  expect(engine.conversations).toBeDefined();
  expect(engine.participants).toBeDefined();
  expect(engine.blocks).toBeDefined();
  expect(engine.permissions).toBeDefined();
  expect(engine.policies).toBeDefined();
});

test("ChatterService delegates to adapter.chatters.create", async () => {
  const createdChatter = createMockChatter({ entityId: "user_123" });

  const mockAdapter: DatabaseAdapter = {
    ...createMockAdapter(),
    chatters: {
      find: async () => null,
      findByEntity: async () => null,
      create: async (data: ChatterInput) => ({
        ...createdChatter,
        ...data,
      }),
      update: async () => createdChatter,
    },
  };

  const engine = betterConversation({ adapter: mockAdapter });
  const chatter = await engine.chatters.create({
    displayName: "Test User",
    entityType: "user",
    entityId: "user_123",
  });

  expect(chatter.id).toBe("chatter_1");
  expect(chatter.displayName).toBe("Test User");
  expect(chatter.entityType).toBe("user");
});

test("createBlock returns BlockDefinition", () => {
  const block = createBlock({
    type: "price_proposal",
    schema: undefined,
  });

  expect(block.type).toBe("price_proposal");
  expect(block).toHaveProperty("type");
});

test("createRole returns RoleDefinition", () => {
  const role = createRole({
    name: "seller",
    extends: "member",
    policy: {
      allowedBlocks: ["text", "media", "price_proposal"],
      maxBlocksPerMinute: 30,
    },
  });

  expect(role.name).toBe("seller");
  expect(role.extends).toBe("member");
  expect(role.policy.allowedBlocks).toEqual(["text", "media", "price_proposal"]);
});

test("default registries include text block and built-in roles", () => {
  expect(defaultBlockRegistry.text).toBeDefined();
  expect(defaultBlockRegistry.text.type).toBe("text");

  expect(defaultRoleRegistry.member).toBeDefined();
  expect(defaultRoleRegistry.owner).toBeDefined();
  expect(defaultRoleRegistry.observer).toBeDefined();
  expect(defaultRoleRegistry.bot).toBeDefined();
});
