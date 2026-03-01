import { describe, expect, test } from "bun:test";
import { type DatabaseAdapter, betterConversation } from "@better-conversation/core";
import { createHonoHandler } from "./index.js";

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

function createMockContext(
  overrides: {
    method?: string;
    path?: string;
    query?: Record<string, string>;
    bodyText?: string;
  } = {}
) {
  const method = overrides.method ?? "GET";
  const path = overrides.path ?? "/conversations";
  const query = overrides.query ?? {};
  const bodyText = overrides.bodyText;

  let textConsumed = false;
  const req = {
    method,
    path,
    url: `http://localhost${path}`,
    query: () => query,
    text: async () => {
      if (textConsumed) throw new Error("Body already consumed");
      textConsumed = true;
      return bodyText ?? "";
    },
  };

  const responses: Response[] = [];
  const c = {
    req,
    json: (body: unknown, status = 200) => {
      const res = new Response(JSON.stringify(body ?? null), {
        status,
        headers: { "Content-Type": "application/json" },
      });
      responses.push(res);
      return res;
    },
    body: (body: BodyInit | null, status: number) => {
      const res = new Response(body, { status });
      responses.push(res);
      return res;
    },
  };
  return { c, responses };
}

const permissiveSecurity = {
  requireAuth: true,
  participantAccessControl: false,
  allowListChatters: true,
  allowListConversations: true,
  allowListConversationsByEntity: true,
  archiveRequiresPermission: false,
  addParticipantRequiresRole: false,
  removeParticipantRequiresRole: false,
  setRoleRequiresAdmin: false,
  grantRevokePermissionsRequiresAdmin: false,
  policyWriteRequiresAdmin: false,
};

describe("createHonoHandler", () => {
  const engine = betterConversation({
    adapter: createMockAdapter(),
    security: permissiveSecurity,
  });

  test("returns handler function", () => {
    const handler = createHonoHandler(engine);
    expect(typeof handler).toBe("function");
  });

  test("GET returns 200 with JSON body", async () => {
    const handler = createHonoHandler(engine);
    const { c } = createMockContext({ method: "GET", path: "/conversations" });
    const res = await handler(c as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("items");
  });

  test("POST with body parses JSON", async () => {
    const handler = createHonoHandler(engine);
    const { c } = createMockContext({
      method: "POST",
      path: "/chatters",
      bodyText: JSON.stringify({
        displayName: "Test",
        entityType: "user",
        entityId: "u1",
      }),
    });
    const res = await handler(c as never);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.displayName).toBe("Test");
  });

  test("strips basePath before matching", async () => {
    const handler = createHonoHandler(engine, { basePath: "/api" });
    const { c } = createMockContext({
      method: "GET",
      path: "/api/conversations",
    });
    const res = await handler(c as never);
    expect(res.status).toBe(200);
  });

  describe("policy endpoints", () => {
    test("GET /policies/roles returns role list", async () => {
      const handler = createHonoHandler(engine);
      const { c } = createMockContext({ method: "GET", path: "/policies/roles" });
      const res = await handler(c as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("roles");
      expect(Array.isArray(json.roles)).toBe(true);
      expect(json.roles).toContain("member");
    });

    test("GET /policies/global returns global policy", async () => {
      const handler = createHonoHandler(engine);
      const { c } = createMockContext({ method: "GET", path: "/policies/global" });
      const res = await handler(c as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("canJoinSelf");
      expect(json.canJoinSelf).toBe(false);
    });

    test("PATCH /policies/global updates global policy", async () => {
      const handler = createHonoHandler(engine, {
        getCurrentChatter: () => "id",
      });
      const { c } = createMockContext({
        method: "PATCH",
        path: "/policies/global",
        bodyText: JSON.stringify({ maxBlocksPerMinute: 30 }),
      });
      const res = await handler(c as never);
      expect([200, 204]).toContain(res.status);
    });
  });
});
