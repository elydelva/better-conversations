import { describe, expect, test } from "bun:test";
import { createMockAdapter, createMockChatter } from "./fixtures/index.js";
import {
  betterConversation,
  createBlock,
  createRole,
  defaultBlockRegistry,
  defaultRoleRegistry,
  version,
} from "./index.js";
import type { ChatterInput } from "./index.js";

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
  const mockAdapter = createMockAdapter({
    chatters: {
      find: async () => null,
      findByEntity: async () => null,
      create: async (data: ChatterInput) => ({
        ...createdChatter,
        ...data,
      }),
      update: async () => createdChatter,
    },
  });

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

describe("createBlock", () => {
  test("returns BlockDefinition with type", () => {
    const block = createBlock({
      type: "price_proposal",
      schema: undefined,
    });

    expect(block.type).toBe("price_proposal");
    expect(block).toHaveProperty("type");
  });
});

describe("createRole", () => {
  test("returns RoleDefinition with name, extends, policy", () => {
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
});

describe("default registries", () => {
  test("defaultBlockRegistry includes text block", () => {
    expect(defaultBlockRegistry.text).toBeDefined();
    expect(defaultBlockRegistry.text.type).toBe("text");
  });

  test("defaultRoleRegistry includes built-in roles", () => {
    expect(defaultRoleRegistry.member).toBeDefined();
    expect(defaultRoleRegistry.owner).toBeDefined();
    expect(defaultRoleRegistry.observer).toBeDefined();
    expect(defaultRoleRegistry.bot).toBeDefined();
  });
});
