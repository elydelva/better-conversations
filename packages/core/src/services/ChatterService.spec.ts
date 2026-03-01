import { describe, expect, test } from "bun:test";
import { createMockAdapter, createMockChatter } from "../fixtures/index.js";
import { ChatterService } from "./ChatterService.js";

describe("ChatterService", () => {
  test("create delegates to adapter", async () => {
    const created = createMockChatter({ entityId: "user_123" });
    const chatters = {
      find: async () => null,
      findByEntity: async () => null,
      create: async () => created,
      update: async () => created,
    };
    const adapter = createMockAdapter({ chatters });
    const service = new ChatterService(adapter.chatters);

    const result = await service.create({
      displayName: "Test User",
      entityType: "user",
      entityId: "user_123",
    });
    expect(result.id).toBe("chatter_1");
    expect(result.entityId).toBe("user_123");
  });

  test("find returns null when adapter returns null", async () => {
    const chatters = {
      find: async () => null,
      findByEntity: async () => null,
      create: async () => createMockChatter(),
      update: async () => createMockChatter(),
    };
    const adapter = createMockAdapter({ chatters });
    const service = new ChatterService(adapter.chatters);

    const result = await service.find("missing");
    expect(result).toBeNull();
  });

  test("update returns updated chatter", async () => {
    const updated = createMockChatter({
      displayName: "Updated Name",
      avatarUrl: "https://example.com/avatar.png",
    });
    const chatters = {
      find: async () => createMockChatter(),
      findByEntity: async () => null,
      create: async () => createMockChatter(),
      update: async () => updated,
    };
    const adapter = createMockAdapter({ chatters });
    const service = new ChatterService(adapter.chatters);

    const result = await service.update("chatter_1", {
      displayName: "Updated Name",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(result.displayName).toBe("Updated Name");
    expect(result.avatarUrl).toBe("https://example.com/avatar.png");
  });
});
