import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { parseBody } from "./parseBody.js";

describe("parseBody", () => {
  const schema = z.object({
    name: z.string().min(1),
    count: z.number().optional(),
  });

  test("returns parsed data when valid", () => {
    const req = { body: { name: "test", count: 5 } };
    const result = parseBody(req, schema);
    expect(result).toEqual({ name: "test", count: 5 });
  });

  test("throws ValidationError when body is null", () => {
    const req = { body: null };
    expect(() => parseBody(req, schema)).toThrow("Request body is required");
  });

  test("throws ValidationError when body is undefined", () => {
    const req = { body: undefined };
    expect(() => parseBody(req, schema)).toThrow("Request body is required");
  });

  test("throws ValidationError when body is not object", () => {
    const req = { body: "string" };
    expect(() => parseBody(req, schema)).toThrow("Request body must be an object");
  });

  test("throws ValidationError when schema validation fails", () => {
    const req = { body: { name: "" } };
    expect(() => parseBody(req, schema)).toThrow();
    try {
      parseBody(req, schema);
    } catch (err: unknown) {
      expect(err).toHaveProperty("metadata");
      expect((err as { metadata?: { issues?: unknown[] } }).metadata?.issues).toBeDefined();
    }
  });
});
