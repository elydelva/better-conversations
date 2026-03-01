import { describe, expect, test } from "bun:test";
import { createMockAdapter } from "../fixtures/index.js";
import { betterConversation } from "../index.js";
import { dispatch } from "./dispatch.js";

describe("dispatch", () => {
  test("dispatches to correct handler with params", async () => {
    const engine = betterConversation({ adapter: createMockAdapter() });
    const req = {
      method: "GET",
      path: "/conversations",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
  });

  test("returns 404 for unmatched route", async () => {
    const engine = betterConversation({ adapter: createMockAdapter() });
    const req = {
      method: "GET",
      path: "/nonexistent/path",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: "NOT_FOUND" });
  });

  test("wraps handler errors via errorToResponse", async () => {
    const engine = betterConversation({ adapter: createMockAdapter() });
    const req = {
      method: "GET",
      path: "/chatters/nonexistent-id",
      params: { id: "nonexistent-id" },
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });

  test("GET /policies/roles returns role list", async () => {
    const engine = betterConversation({ adapter: createMockAdapter() });
    const req = {
      method: "GET",
      path: "/policies/roles",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("roles");
    expect(Array.isArray((res.body as { roles: string[] }).roles)).toBe(true);
    expect((res.body as { roles: string[] }).roles).toContain("member");
  });

  test("strips basePath before matching", async () => {
    const adapter = createMockAdapter({
      conversations: {
        ...createMockAdapter().conversations,
        find: async () => ({
          id: "conv-1",
          title: null,
          status: "open" as const,
          entityType: null,
          entityId: null,
          createdBy: "ch1",
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    });
    const engine = betterConversation({ adapter });
    const req = {
      method: "GET",
      path: "/api/conversations/conv-1",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req, "/api");
    expect(res.status).toBe(200);
  });
});
