import { describe, expect, test } from "bun:test";
import { createInMemoryRateLimitStore } from "./createInMemoryRateLimitStore.js";

describe("createInMemoryRateLimitStore", () => {
  test("check returns true when under limit", async () => {
    const store = createInMemoryRateLimitStore();
    const allowed = await store.check("user:conv", 5, 60_000);
    expect(allowed).toBe(true);
  });

  test("check returns false after limit exceeded", async () => {
    const store = createInMemoryRateLimitStore();
    for (let i = 0; i < 3; i++) {
      await store.record("user:conv");
    }
    const allowed = await store.check("user:conv", 3, 60_000);
    expect(allowed).toBe(false);
  });

  test("record increments count", async () => {
    const store = createInMemoryRateLimitStore();
    await store.record("key1");
    await store.record("key1");
    const allowed = await store.check("key1", 2, 60_000);
    expect(allowed).toBe(false);
  });
});
