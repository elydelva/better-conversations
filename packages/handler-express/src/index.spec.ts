import { describe, expect, test } from "bun:test";
import { type DatabaseAdapter, betterConversation } from "@better-conversation/core";
import { createExpressHandler } from "./index.js";

function createMockAdapter(): DatabaseAdapter {
  const base = {
    id: "id",
    displayName: "Test",
    entityType: "user",
    entityId: null,
    avatarUrl: null,
    metadata: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
    chatters: {
      find: async () => ({ ...base }),
      findByEntity: async () => null,
      create: async (d: { displayName: string; entityType: string; entityId?: string | null }) => ({
        ...base,
        ...d,
      }),
      update: async () => ({ ...base }),
    },
    conversations: {
      find: async () => null,
      findByEntity: async () => [],
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => ({
        id: "c1",
        title: null,
        status: "open",
        entityType: null,
        entityId: null,
        createdBy: "ch1",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: async () => ({
        id: "c1",
        title: null,
        status: "open",
        entityType: null,
        entityId: null,
        createdBy: "ch1",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
    participants: {
      list: async () => [],
      find: async () => null,
      add: async () => ({
        id: "p1",
        conversationId: "c1",
        chatterId: "ch1",
        role: "member",
        joinedAt: new Date(),
        leftAt: null,
        lastReadAt: null,
        metadata: null,
      }),
      update: async () => ({
        id: "p1",
        conversationId: "c1",
        chatterId: "ch1",
        role: "member",
        joinedAt: new Date(),
        leftAt: null,
        lastReadAt: null,
        metadata: null,
      }),
      remove: async () => {},
    },
    blocks: {
      find: async () => null,
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => ({
        id: "b1",
        conversationId: "c1",
        authorId: "ch1",
        type: "text",
        body: null,
        metadata: null,
        threadParentId: null,
        status: "published",
        refusalReason: null,
        flaggedAt: null,
        editedAt: null,
        createdAt: new Date(),
      }),
      update: async () => ({
        id: "b1",
        conversationId: "c1",
        authorId: "ch1",
        type: "text",
        body: null,
        metadata: null,
        threadParentId: null,
        status: "published",
        refusalReason: null,
        flaggedAt: null,
        editedAt: null,
        createdAt: new Date(),
      }),
      softDelete: async () => {},
    },
    permissions: {
      check: async () => false,
      grant: async () => {},
      revoke: async () => {},
    },
  };
}

function createMockReq(
  overrides: {
    method?: string;
    path?: string;
    query?: Record<string, string>;
    body?: unknown;
  } = {}
) {
  return {
    method: overrides.method ?? "GET",
    path: overrides.path ?? "/conversations",
    query: overrides.query ?? {},
    body: overrides.body,
    baseUrl: "",
    originalUrl: "",
    params: {},
    headers: {},
    get: () => undefined,
  };
}

function createMockRes() {
  const res: {
    statusCode: number;
    body: unknown;
    status: (code: number) => typeof res;
    json: (b: unknown) => void;
    sendStatus: (code: number) => void;
  } = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(b: unknown) {
      res.body = b;
    },
    sendStatus(code: number) {
      res.statusCode = code;
      res.body = undefined;
    },
  };
  return res;
}

describe("createExpressHandler", () => {
  const engine = betterConversation({ adapter: createMockAdapter() });

  test("returns RequestHandler function", () => {
    const handler = createExpressHandler(engine);
    expect(typeof handler).toBe("function");
    expect(handler.length).toBeGreaterThanOrEqual(2);
  });

  test("GET returns 200 with JSON body", async () => {
    const handler = createExpressHandler(engine);
    const req = createMockReq({ method: "GET", path: "/conversations" });
    const res = createMockRes();
    await handler(req as never, res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("items");
  });

  test("POST with body parses JSON", async () => {
    const handler = createExpressHandler(engine);
    const req = createMockReq({
      method: "POST",
      path: "/chatters",
      body: { displayName: "Test", entityType: "user", entityId: "u1" },
    });
    const res = createMockRes();
    await handler(req as never, res as never);
    expect(res.statusCode).toBe(201);
    expect((res.body as { displayName?: string }).displayName).toBe("Test");
  });

  test("strips basePath before matching", async () => {
    const handler = createExpressHandler(engine, { basePath: "/api" });
    const req = createMockReq({
      method: "GET",
      path: "/api/conversations",
    });
    const res = createMockRes();
    await handler(req as never, res as never);
    expect(res.statusCode).toBe(200);
  });
});
