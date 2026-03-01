import { describe, expect, test } from "bun:test";
import { createInMemoryAuditStore } from "./createInMemoryAuditStore.js";

describe("createInMemoryAuditStore", () => {
  test("append adds entry with id and timestamp", async () => {
    const store = createInMemoryAuditStore();
    await store.append({
      event: "block:created",
      entityType: "block",
      entityId: "blk-1",
      payload: { conversationId: "c1", authorId: "u1" },
    });
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0]?.id).toBeTruthy();
    expect(store.entries[0]?.timestamp).toBeInstanceOf(Date);
    expect(store.entries[0]?.event).toBe("block:created");
    expect(store.entries[0]?.entityType).toBe("block");
    expect(store.entries[0]?.entityId).toBe("blk-1");
  });

  test("query filters by event", async () => {
    const store = createInMemoryAuditStore();
    await store.append({
      event: "block:created",
      entityType: "block",
      entityId: "blk-1",
      payload: {},
    });
    await store.append({
      event: "conversation:created",
      entityType: "conversation",
      entityId: "c1",
      payload: {},
    });
    const result = (await store.query?.({ event: "block:created" })) ?? [];
    expect(result).toHaveLength(1);
    expect(result[0]?.event).toBe("block:created");
  });

  test("query filters by entityType and entityId", async () => {
    const store = createInMemoryAuditStore();
    await store.append({
      event: "block:created",
      entityType: "block",
      entityId: "blk-1",
      payload: {},
    });
    await store.append({
      event: "block:created",
      entityType: "block",
      entityId: "blk-2",
      payload: {},
    });
    const result = (await store.query?.({ entityType: "block", entityId: "blk-2" })) ?? [];
    expect(result).toHaveLength(1);
    expect(result[0]?.entityId).toBe("blk-2");
  });

  test("query respects limit and returns reverse order", async () => {
    const store = createInMemoryAuditStore();
    for (let i = 0; i < 5; i++) {
      await store.append({
        event: "block:created",
        entityType: "block",
        entityId: `blk-${i}`,
        payload: {},
      });
    }
    const result = (await store.query?.({ limit: 2 })) ?? [];
    expect(result).toHaveLength(2);
    expect(result[0]?.entityId).toBe("blk-4");
    expect(result[1]?.entityId).toBe("blk-3");
  });
});
