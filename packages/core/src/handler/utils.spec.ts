import { describe, expect, test } from "bun:test";
import { BlockRefusedError } from "@better-conversation/errors";
import {
  errorToResponse,
  parseJsonBody,
  parseLimit,
  queryToRecord,
  successResponse,
} from "./utils.js";

describe("parseJsonBody", () => {
  test("returns null for null input", () => {
    expect(parseJsonBody(null)).toBe(null);
  });

  test("returns null for empty string", () => {
    expect(parseJsonBody("")).toBe(null);
  });

  test("returns null for whitespace-only string", () => {
    expect(parseJsonBody("   ")).toBe(null);
  });

  test("returns parsed object for valid JSON", () => {
    const obj = { foo: "bar", num: 42 };
    expect(parseJsonBody(JSON.stringify(obj))).toEqual(obj);
  });

  test("returns null for invalid JSON", () => {
    expect(parseJsonBody("{ invalid json }")).toBe(null);
  });
});

describe("errorToResponse", () => {
  test("returns statusCode and body for ConversationError with expose true", () => {
    const err = new BlockRefusedError("refused", { expose: true });
    const res = errorToResponse(err);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: expect.any(String), message: "refused" });
  });

  test("returns 500 for non-ConversationError", () => {
    const res = errorToResponse(new Error("boom"));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });

  test("returns 500 for string thrown", () => {
    const res = errorToResponse("something went wrong");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });

  test("returns 500 for ConversationError with expose false", () => {
    const err = new BlockRefusedError("refused", { expose: false });
    const res = errorToResponse(err);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });
});

describe("parseLimit", () => {
  test("returns default when undefined", () => {
    expect(parseLimit(undefined, 50)).toBe(50);
  });
  test("bounds to 1-100", () => {
    expect(parseLimit("200", 50)).toBe(100);
    expect(parseLimit("0", 50)).toBe(50);
    expect(parseLimit("-5", 50)).toBe(50);
  });
  test("parses valid numbers", () => {
    expect(parseLimit("25", 50)).toBe(25);
    expect(parseLimit("1", 50)).toBe(1);
  });
  test("returns default for NaN", () => {
    expect(parseLimit("abc", 50)).toBe(50);
  });
});

describe("queryToRecord", () => {
  test("converts query to Record<string, string>", () => {
    expect(queryToRecord({ limit: "10", cursor: "x" })).toEqual({ limit: "10", cursor: "x" });
  });
  test("takes first element of arrays", () => {
    expect(queryToRecord({ limit: ["20", "30"] })).toEqual({ limit: "20" });
  });
  test("skips undefined and null", () => {
    expect(queryToRecord({ a: "1", b: undefined, c: null })).toEqual({ a: "1" });
  });
  test("returns empty for null/undefined input", () => {
    expect(queryToRecord(null)).toEqual({});
    expect(queryToRecord(undefined)).toEqual({});
  });
});

describe("successResponse", () => {
  test("returns 200 by default", () => {
    const res = successResponse({ id: "x" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "x" });
  });

  test("returns custom status when provided", () => {
    const res = successResponse({ created: true }, 201);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ created: true });
  });
});
