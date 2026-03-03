import { describe, expect, test } from "bun:test";
import { betterConversation } from "@better-conversation/core";
import { createHonoHandler } from "@better-conversation/handler-hono";
import { Hono } from "hono";
import { createInMemoryAdapter } from "./inMemoryAdapter.js";

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

function createApp() {
  const adapter = createInMemoryAdapter();
  const engine = betterConversation({
    adapter,
    security: permissiveSecurity,
  });
  const handler = createHonoHandler(engine, {
    basePath: "/api",
    getCurrentChatter: () => "ch1",
  });
  const app = new Hono();
  app.all("/api/*", handler);
  return { app, adapter };
}

async function fetchJson(
  app: { fetch: (req: Request) => Promise<Response> },
  url: string,
  init?: RequestInit
) {
  const base = "http://localhost";
  const res = await app.fetch(new Request(base + url, init));
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { status: res.status, body };
}

describe("E2E Hono", () => {
  test("GET /api/chatters returns empty array when no chatters", async () => {
    const { app } = createApp();
    const { status, body } = await fetchJson(app, "/api/chatters");
    expect(status).toBe(200);
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/chatters creates chatter", async () => {
    const { app } = createApp();
    const { status, body } = await fetchJson(app, "/api/chatters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Hono User", entityType: "user" }),
    });
    expect(status).toBe(201);
    expect(body.id).toBeDefined();
    expect(body.displayName).toBe("Hono User");
  });

  test("GET /api/policies/roles returns roles", async () => {
    const { app } = createApp();
    const { status, body } = await fetchJson(app, "/api/policies/roles");
    expect(status).toBe(200);
    expect(body).toHaveProperty("roles");
  });
});
