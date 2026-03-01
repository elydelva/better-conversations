import { describe, expect, test } from "bun:test";
import { createMockAdapter } from "../fixtures/index.js";
import { betterConversation } from "../index.js";
import { dispatch } from "./dispatch.js";

const permissiveSecurity = {
  requireAuth: false,
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

describe("dispatch", () => {
  test("dispatches to correct handler with params", async () => {
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
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
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
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
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
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
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
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

  test("auth: when req.auth.chatterId does not match params.chatterId, returns 403", async () => {
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
    const req = {
      method: "GET",
      path: "/policies/chatters/ch1",
      params: { chatterId: "ch1" },
      query: {},
      body: null,
      auth: { chatterId: "ch_other" },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(403);
  });

  test("auth: when req.auth.chatterId matches params.chatterId, returns 200", async () => {
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
    const req = {
      method: "GET",
      path: "/policies/chatters/ch1",
      params: { chatterId: "ch1" },
      query: {},
      body: null,
      auth: { chatterId: "ch1" },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
  });

  test("POST /chatters with invalid body returns 400 ValidationError", async () => {
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
    const req = {
      method: "POST",
      path: "/chatters",
      params: {},
      query: {},
      body: { displayName: "", entityType: "user" },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "VALIDATION_ERROR", message: expect.any(String) });
  });

  test("POST /chatters with valid body returns 201", async () => {
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: permissiveSecurity,
    });
    const req = {
      method: "POST",
      path: "/chatters",
      params: {},
      query: {},
      body: { displayName: "Test", entityType: "user" },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("displayName");
  });

  test("security: GET /chatters without admin:listChatters returns 403 when allowListChatters false", async () => {
    const engine = betterConversation({
      adapter: createMockAdapter(),
      security: {
        ...permissiveSecurity,
        allowListChatters: false,
      },
    });
    const req = {
      method: "GET",
      path: "/chatters",
      params: {},
      query: {},
      body: null,
      auth: { chatterId: "ch1" },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(403);
    expect((res.body as { code?: string }).code).toBe("FORBIDDEN");
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
    const engine = betterConversation({
      adapter,
      security: permissiveSecurity,
    });
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
