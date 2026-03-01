import { describe, expect, test } from "bun:test";
import { chatterCreateSchema, chatterUpdateSchema } from "./chatters.js";

describe("chatterCreateSchema", () => {
  test("accepts valid input", () => {
    const result = chatterCreateSchema.safeParse({
      displayName: "Alice",
      entityType: "user",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Alice");
      expect(result.data.entityType).toBe("user");
    }
  });

  test("rejects empty displayName", () => {
    const result = chatterCreateSchema.safeParse({
      displayName: "",
      entityType: "user",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing entityType", () => {
    const result = chatterCreateSchema.safeParse({
      displayName: "Alice",
    });
    expect(result.success).toBe(false);
  });
});

describe("chatterUpdateSchema", () => {
  test("accepts partial input", () => {
    const result = chatterUpdateSchema.safeParse({ displayName: "Bob" });
    expect(result.success).toBe(true);
  });

  test("accepts empty object", () => {
    const result = chatterUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
