import { describe, expect, test } from "bun:test";
import { findRoute } from "./routes.js";

describe("findRoute", () => {
  test("matches POST /chatters", () => {
    const result = findRoute("POST", "/chatters");
    expect(result).not.toBeNull();
    expect(result?.route.method).toBe("POST");
    expect(result?.route.path).toBe("/chatters");
    expect(result?.params).toEqual({});
  });

  test("matches GET /conversations/:id with params", () => {
    const result = findRoute("GET", "/conversations/conv-123");
    expect(result).not.toBeNull();
    expect(result?.route.method).toBe("GET");
    expect(result?.params).toEqual({ id: "conv-123" });
  });

  test("returns null for unknown path", () => {
    const result = findRoute("GET", "/unknown/resource");
    expect(result).toBeNull();
  });

  test("returns null for wrong method", () => {
    const result = findRoute("DELETE", "/chatters");
    expect(result).toBeNull();
  });

  test("strips trailing slash from path", () => {
    const result = findRoute("GET", "/conversations/conv-1/");
    expect(result).not.toBeNull();
    expect(result?.params).toEqual({ id: "conv-1" });
  });
});
