import { describe, expect, test } from "bun:test";
import type { DatabaseAdapter } from "@better-conversation/core";
import { drizzleAdapter } from "./index.js";

function createMockDb() {
  const emptyResult = Promise.resolve([]);
  const selectChain = {
    from: () => selectChain,
    where: () => emptyResult,
    limit: () => emptyResult,
    orderBy: () => selectChain,
  };
  return {
    select: () => selectChain,
    insert: () => ({
      values: () => Promise.resolve(),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  };
}

describe("drizzleAdapter", () => {
  test("returns DatabaseAdapter", () => {
    const db = createMockDb();
    const adapter = drizzleAdapter(db);
    expect(adapter).toBeDefined();
    expect(adapter.chatters).toBeDefined();
    expect(adapter.conversations).toBeDefined();
    expect(adapter.participants).toBeDefined();
    expect(adapter.blocks).toBeDefined();
    expect(adapter.permissions).toBeDefined();
    expect(typeof adapter.chatters.create).toBe("function");
    expect(typeof adapter.chatters.find).toBe("function");
    expect(typeof adapter.blocks.create).toBe("function");
    expect(typeof adapter.blocks.list).toBe("function");
  });

  test("create delegates with correct shape", async () => {
    const db = createMockDb();
    const adapter = drizzleAdapter(db, {
      generateId: () => "gen-id-123",
    });
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

  test("list with chatterId returns paginated result", async () => {
    const db = createMockDb();
    const adapter = drizzleAdapter(db);
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
