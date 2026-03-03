import { describe, expect, test } from "bun:test";
import type { DatabaseAdapter } from "@better-conversation/core";
import { mongodbAdapter } from "./index.js";

describe("mongodbAdapter", () => {
  test("returns DatabaseAdapter with all required interfaces", () => {
    const adapter = mongodbAdapter(undefined, { tablePrefix: "bc_" });
    expect(adapter).toBeDefined();
    expect(adapter.chatters).toBeDefined();
    expect(adapter.conversations).toBeDefined();
    expect(adapter.participants).toBeDefined();
    expect(adapter.blocks).toBeDefined();
    expect(adapter.permissions).toBeDefined();
    expect(adapter.registries).toBeDefined();
    expect(adapter.policies).toBeDefined();
    expect(typeof adapter.chatters.create).toBe("function");
    expect(typeof adapter.chatters.find).toBe("function");
    expect(typeof adapter.conversations.create).toBe("function");
    expect(typeof adapter.blocks.create).toBe("function");
  });

  test("chatters.find throws NOT_IMPL (stub)", async () => {
    const adapter = mongodbAdapter() as DatabaseAdapter;
    await expect(adapter.chatters.find("any")).rejects.toThrow(/not implemented/i);
  });

  test("uses custom tablePrefix", () => {
    const adapter = mongodbAdapter(undefined, { tablePrefix: "custom_" });
    expect(adapter).toBeDefined();
  });
});
