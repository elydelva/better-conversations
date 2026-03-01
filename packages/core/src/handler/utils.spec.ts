import { describe, expect, test } from "bun:test";
import { BlockRefusedError } from "@better-conversation/errors";
import { errorToResponse, parseJsonBody, successResponse } from "./utils.js";

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
