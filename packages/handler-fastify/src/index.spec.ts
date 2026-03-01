import { describe, expect, test } from "bun:test";
import { type DatabaseAdapter, betterConversation } from "@better-conversation/core";
import Fastify from "fastify";
import { createFastifyHandler } from "./index.js";

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
      create: async (d: {
        displayName: string;
        entityType: string;
        entityId?: string | null;
      }) => ({
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

describe("createFastifyHandler", () => {
  const engine = betterConversation({
    adapter: createMockAdapter(),
    security: permissiveSecurity,
  });

  test("returns plugin function", () => {
    const plugin = createFastifyHandler(engine);
    expect(typeof plugin).toBe("function");
  });

  test("GET returns 200 with JSON body", async () => {
    const app = Fastify();
    await app.register(createFastifyHandler(engine), {
      prefix: "/api/conversation",
    });
    const res = await app.inject({
      method: "GET",
      url: "/api/conversation/conversations",
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json).toHaveProperty("items");
  });

  test("POST with body parses JSON", async () => {
    const app = Fastify();
    await app.register(createFastifyHandler(engine), {
      prefix: "/api/conversation",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/conversation/chatters",
      payload: { displayName: "Test", entityType: "user", entityId: "u1" },
    });
    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json.displayName).toBe("Test");
  });

  test("strips basePath before matching", async () => {
    const app = Fastify();
    await app.register(createFastifyHandler(engine, { basePath: "/api" }), {
      prefix: "/api",
    });
    const res = await app.inject({
      method: "GET",
      url: "/api/conversations",
    });
    expect(res.statusCode).toBe(200);
  });

  test("uses prefix as basePath when no options.basePath", async () => {
    const app = Fastify();
    await app.register(createFastifyHandler(engine), {
      prefix: "/api/conversation",
    });
    const res = await app.inject({
      method: "GET",
      url: "/api/conversation/conversations",
    });
    expect(res.statusCode).toBe(200);
  });

  describe("policy endpoints", () => {
    test("GET /policies/roles returns role list", async () => {
      const app = Fastify();
      await app.register(createFastifyHandler(engine), {
        prefix: "/api",
      });
      const res = await app.inject({
        method: "GET",
        url: "/api/policies/roles",
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json).toHaveProperty("roles");
      expect(Array.isArray(json.roles)).toBe(true);
      expect(json.roles).toContain("member");
    });

    test("GET /policies/global returns global policy", async () => {
      const app = Fastify();
      await app.register(createFastifyHandler(engine), {
        prefix: "/api",
      });
      const res = await app.inject({
        method: "GET",
        url: "/api/policies/global",
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json).toHaveProperty("canJoinSelf");
      expect(json.canJoinSelf).toBe(false);
    });

    test("PATCH /policies/global updates global policy", async () => {
      const app = Fastify();
      await app.register(createFastifyHandler(engine, { getCurrentChatter: () => "id" }), {
        prefix: "/api",
      });
      const res = await app.inject({
        method: "PATCH",
        url: "/api/policies/global",
        payload: { maxBlocksPerMinute: 30 },
      });
      expect([200, 204]).toContain(res.statusCode);
    });
  });
});
