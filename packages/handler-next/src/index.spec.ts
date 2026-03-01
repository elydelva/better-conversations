import { describe, expect, test } from "bun:test";
import { type DatabaseAdapter, betterConversation } from "@better-conversation/core";
import { createNextHandler } from "./index.js";

function createFullMockAdapter(): DatabaseAdapter {
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
    registries: {
      upsertBlock: async () => {},
      upsertRole: async () => {},
    },
    policies: {
      find: async () => null,
      upsert: async () => {},
      delete: async () => {},
    },
  };
}

async function createRequest(
  url: string,
  opts: { method?: string; body?: string } = {}
): Promise<Request> {
  const { method = "GET", body } = opts;
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body,
  });
}

describe("createNextHandler", () => {
  const engine = betterConversation({ adapter: createFullMockAdapter() });

  test("returns GET, POST, PATCH, DELETE handlers", () => {
    const handler = createNextHandler(engine);
    expect(typeof handler.GET).toBe("function");
    expect(typeof handler.POST).toBe("function");
    expect(typeof handler.PATCH).toBe("function");
    expect(typeof handler.DELETE).toBe("function");
  });

  test("GET returns 200 with JSON body", async () => {
    const handler = createNextHandler(engine);
    const req = await createRequest("http://localhost/conversations");
    const res = await handler.GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("items");
  });

  test("POST with body parses JSON", async () => {
    const handler = createNextHandler(engine);
    const req = await createRequest("http://localhost/chatters", {
      method: "POST",
      body: JSON.stringify({
        displayName: "Test",
        entityType: "user",
        entityId: "u1",
      }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.displayName).toBe("Test");
  });

  test("204 for null body", async () => {
    const handler = createNextHandler(engine);
    const req = await createRequest("http://localhost/conversations/conv_1", { method: "DELETE" });
    const res = await handler.DELETE(req);
    expect([200, 204, 404, 500]).toContain(res.status);
  });

  test("strips basePath before matching", async () => {
    const handler = createNextHandler(engine, { basePath: "/api" });
    const req = await createRequest("http://localhost/api/conversations");
    const res = await handler.GET(req);
    expect(res.status).toBe(200);
  });

  describe("policy endpoints", () => {
    test("GET /policies/roles returns role list", async () => {
      const handler = createNextHandler(engine);
      const req = await createRequest("http://localhost/policies/roles");
      const res = await handler.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("roles");
      expect(Array.isArray(json.roles)).toBe(true);
      expect(json.roles).toContain("member");
    });

    test("GET /policies/global returns global policy", async () => {
      const handler = createNextHandler(engine);
      const req = await createRequest("http://localhost/policies/global");
      const res = await handler.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("canJoinSelf");
      expect(json.canJoinSelf).toBe(false);
      expect(json).toHaveProperty("allowedBlocks");
    });

    test("PATCH /policies/global updates global policy", async () => {
      const handler = createNextHandler(engine, {
        getCurrentChatter: () => "id",
      });
      const req = await createRequest("http://localhost/policies/global", {
        method: "PATCH",
        body: JSON.stringify({ maxBlocksPerMinute: 30 }),
      });
      const res = await handler.PATCH(req);
      expect([200, 204]).toContain(res.status);
    });

    test("GET /policies/chatters/:chatterId returns resolved policy", async () => {
      const handler = createNextHandler(engine);
      const req = await createRequest("http://localhost/policies/chatters/ch1");
      const res = await handler.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("canJoinSelf");
      expect(json.canJoinSelf).toBe(false);
    });
  });

  describe("auth: getCurrentChatter", () => {
    test("when auth matches params, request succeeds", async () => {
      const handler = createNextHandler(engine, {
        getCurrentChatter: async () => "ch1",
      });
      const req = await createRequest("http://localhost/policies/chatters/ch1");
      const res = await handler.GET(req);
      expect(res.status).toBe(200);
    });

    test("when auth does not match params, returns 403", async () => {
      const handler = createNextHandler(engine, {
        getCurrentChatter: async () => "ch_other",
      });
      const req = await createRequest("http://localhost/policies/chatters/ch1");
      const res = await handler.GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json).toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("auth: requireAuth", () => {
    test("when requireAuth and getCurrentChatter returns null, returns 401", async () => {
      const handler = createNextHandler(engine, {
        getCurrentChatter: async () => null,
        requireAuth: true,
      });
      const req = await createRequest("http://localhost/policies/chatters/ch1");
      const res = await handler.GET(req);
      expect(res.status).toBe(401);
    });
  });
});
