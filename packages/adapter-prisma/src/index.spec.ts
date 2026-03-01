import { describe, expect, test } from "bun:test";
import type { DatabaseAdapter } from "@better-conversation/core";
import { prismaAdapter } from "./index.js";

function createMockPrisma() {
  const now = new Date();
  return {
    bcChatter: {
      findUnique: () => Promise.resolve(null),
      findFirst: () => Promise.resolve(null),
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: data.id,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl ?? null,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        metadata: data.metadata ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "x",
        displayName: data.displayName ?? "",
        avatarUrl: data.avatarUrl ?? null,
        entityType: data.entityType ?? "",
        entityId: data.entityId ?? null,
        metadata: data.metadata ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    },
    bcConversation: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: async () => ({}),
      update: async () => ({}),
    },
    bcParticipant: {
      findMany: () => Promise.resolve([]),
      findFirst: () => Promise.resolve(null),
      findUnique: () => Promise.resolve(null),
      create: async () => ({}),
      update: async () => ({}),
      delete: () => Promise.resolve({}),
    },
    bcBlock: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: async () => ({}),
      update: () => Promise.resolve({}),
    },
    bcChatterPermission: {
      findFirst: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      deleteMany: () => Promise.resolve({}),
    },
    bcBlockRegistry: {
      upsert: () => Promise.resolve({}),
    },
    bcRoleRegistry: {
      upsert: () => Promise.resolve({}),
    },
    bcPolicy: {
      findFirst: () => Promise.resolve(null),
      upsert: () => Promise.resolve({}),
      deleteMany: () => Promise.resolve({}),
    },
  };
}

describe("prismaAdapter", () => {
  test("returns DatabaseAdapter", () => {
    const prisma = createMockPrisma();
    const adapter = prismaAdapter(prisma);
    expect(adapter).toBeDefined();
    expect(adapter.chatters).toBeDefined();
    expect(adapter.conversations).toBeDefined();
    expect(adapter.participants).toBeDefined();
    expect(adapter.blocks).toBeDefined();
    expect(adapter.permissions).toBeDefined();
    expect(adapter.registries).toBeDefined();
    expect(adapter.policies).toBeDefined();
    expect(typeof adapter.registries.upsertBlock).toBe("function");
    expect(typeof adapter.registries.upsertRole).toBe("function");
    expect(typeof adapter.policies.find).toBe("function");
    expect(typeof adapter.policies.upsert).toBe("function");
    expect(typeof adapter.chatters.create).toBe("function");
    expect(typeof adapter.chatters.find).toBe("function");
    expect(typeof adapter.blocks.create).toBe("function");
    expect(typeof adapter.blocks.list).toBe("function");
  });

  test("chatters.create delegates with correct shape", async () => {
    const prisma = createMockPrisma();
    const adapter = prismaAdapter(prisma, { generateId: () => "gen-id-123" });
    const result = await adapter.chatters.create({
      displayName: "Test User",
      entityType: "user",
      entityId: "user_123",
    });
    expect(result.id).toBe("gen-id-123");
    expect(result.displayName).toBe("Test User");
    expect(result.entityType).toBe("user");
    expect(result.entityId).toBe("user_123");
    expect(result.isActive).toBe(true);
  });

  test("conversations.list with chatterId returns paginated result", async () => {
    const prisma = createMockPrisma();
    const adapter = prismaAdapter(prisma);
    const result = await adapter.conversations.list({
      chatterId: "chatter_1",
      limit: 10,
    });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("hasMore");
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
