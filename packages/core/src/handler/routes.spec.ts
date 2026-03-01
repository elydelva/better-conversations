import { describe, expect, test } from "bun:test";
import { buildRoutes, findRoute, routes } from "./routes.js";

describe("findRoute", () => {
  test("matches POST /chatters", () => {
    const result = findRoute(routes, "POST", "/chatters");
    expect(result).not.toBeNull();
    expect(result?.route.method).toBe("POST");
    expect(result?.route.path).toBe("/chatters");
    expect(result?.params).toEqual({});
  });

  test("matches GET /conversations/:id with params", () => {
    const result = findRoute(routes, "GET", "/conversations/conv-123");
    expect(result).not.toBeNull();
    expect(result?.route.method).toBe("GET");
    expect(result?.params).toEqual({ id: "conv-123" });
  });

  test("matches PATCH /conversations/:id/participants/:chatterId", () => {
    const result = findRoute(routes, "PATCH", "/conversations/conv_1/participants/chatter_1");
    expect(result).not.toBeNull();
    expect(result?.params).toEqual({ id: "conv_1", chatterId: "chatter_1" });
  });

  test("returns null for unknown path", () => {
    const result = findRoute(routes, "GET", "/unknown/resource");
    expect(result).toBeNull();
  });

  test("returns null for wrong method", () => {
    const result = findRoute(routes, "DELETE", "/chatters");
    expect(result).toBeNull();
  });

  test("strips trailing slash from path", () => {
    const result = findRoute(routes, "GET", "/conversations/conv-1/");
    expect(result).not.toBeNull();
    expect(result?.params).toEqual({ id: "conv-1" });
  });
});

describe("buildRoutes", () => {
  test("includes plugin routes", () => {
    const pluginRoutes = buildRoutes([
      {
        name: "test",
        routes: [
          { method: "GET", path: "/custom", handler: async () => ({ status: 200, body: {} }) },
        ],
      },
    ]);
    const result = findRoute(pluginRoutes, "GET", "/custom");
    expect(result).not.toBeNull();
    expect(result?.route.path).toBe("/custom");
  });

  test("does not include stream or markRead in core routes", () => {
    const core = buildRoutes([]);
    expect(core.some((r) => r.path.endsWith("/stream"))).toBe(false);
    expect(core.some((r) => r.path.endsWith("/read"))).toBe(false);
  });
});
