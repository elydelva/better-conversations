import { describe, expect, test } from "bun:test";
import { betterConversation, dispatch } from "@better-conversation/core";
import { createMockAdapter } from "@better-conversation/core/fixtures";
import { ssePlugin } from "./index.js";

describe("plugin-sse", () => {
  test("ssePlugin exposes name and routes", () => {
    expect(ssePlugin.name).toBe("sse");
    expect(ssePlugin.routes).toBeDefined();
    expect(ssePlugin.routes?.length).toBe(1);
    expect(ssePlugin.routes?.[0]).toMatchObject({
      method: "GET",
      path: "/conversations/:id/stream",
    });
  });

  test("GET /conversations/:id/stream returns SSE stream when plugin is used", async () => {
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
    const engine = betterConversation({ adapter, plugins: [ssePlugin] });
    const req = {
      method: "GET",
      path: "/conversations/conv-1/stream",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    expect(res.headers?.["Content-Type"]).toBe("text/event-stream");
    expect(res.stream).toBeInstanceOf(ReadableStream);
  });

  test("GET /conversations/:id/stream returns error when conversation not found", async () => {
    const adapter = createMockAdapter({
      conversations: {
        ...createMockAdapter().conversations,
        find: async () => null,
      },
    });
    const engine = betterConversation({ adapter, plugins: [ssePlugin] });
    const req = {
      method: "GET",
      path: "/conversations/nonexistent/stream",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty("code");
  });

  test("GET /conversations/:id/stream returns 404 when plugin is not used", async () => {
    const adapter = createMockAdapter();
    const engine = betterConversation({ adapter });
    const req = {
      method: "GET",
      path: "/conversations/conv-1/stream",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: "NOT_FOUND" });
  });
});
