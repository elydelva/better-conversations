import { describe, expect, test } from "bun:test";
import { createAdapterHelpers } from "@better-agnostic/adapter";

describe("createAdapterHelpers", () => {
  test("default tablePrefix is empty (from @better-agnostic/adapter)", () => {
    const helpers = createAdapterHelpers();
    expect(helpers.tablePrefix).toBe("");
  });

  test("custom tablePrefix when provided", () => {
    const helpers = createAdapterHelpers({ tablePrefix: "my_" });
    expect(helpers.tablePrefix).toBe("my_");
  });

  test("uses crypto.randomUUID when no generateId provided", () => {
    const helpers = createAdapterHelpers();
    const id1 = helpers.generateId();
    const id2 = helpers.generateId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  test("custom generateId used when provided", () => {
    const customId = "custom-id-123";
    const helpers = createAdapterHelpers({
      generateId: () => customId,
    });
    expect(helpers.generateId()).toBe(customId);
  });

  describe("ensureTimestamps", () => {
    test("create mode adds createdAt and updatedAt", () => {
      const helpers = createAdapterHelpers();
      const data = { foo: "bar" };
      const result = helpers.ensureTimestamps(data, "create");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.foo).toBe("bar");
      expect(result.createdAt).toEqual(result.updatedAt);
    });

    test("update mode adds updatedAt only", () => {
      const helpers = createAdapterHelpers();
      const data = { foo: "bar", createdAt: new Date("2020-01-01") };
      const result = helpers.ensureTimestamps(data, "update");
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt).toEqual(new Date("2020-01-01"));
    });
  });
});
