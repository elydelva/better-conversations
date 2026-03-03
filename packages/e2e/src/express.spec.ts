import { describe, expect, test } from "bun:test";
import { betterConversation } from "@better-conversation/core";
import { createExpressHandler } from "@better-conversation/handler-express";
import express from "express";
import supertest from "supertest";
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

function createApp(authRef?: { chatterId: string }) {
  const ref = authRef ?? { chatterId: "ch1" };
  const adapter = createInMemoryAdapter();
  const engine = betterConversation({
    adapter,
    security: permissiveSecurity,
  });
  const handler = createExpressHandler(engine, {
    basePath: "/api",
    getCurrentChatter: () => ref.chatterId,
  });
  const app = express();
  app.use(express.json());
  app.use("/api", handler);
  return { app, adapter, engine, authRef: ref };
}

describe("E2E Express", () => {
  test("GET /api/chatters returns empty array when no chatters", async () => {
    const { app } = createApp();
    const res = await supertest(app).get("/api/chatters").expect(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test("POST /api/chatters creates chatter, GET returns it", async () => {
    const { app } = createApp();
    const created = await supertest(app)
      .post("/api/chatters")
      .send({ displayName: "E2E User", entityType: "user", entityId: "u1" })
      .expect(201);
    expect(created.body.id).toBeDefined();
    expect(created.body.displayName).toBe("E2E User");

    const list = await supertest(app).get("/api/chatters").expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].displayName).toBe("E2E User");
  });

  test("POST /api/conversations creates conversation", async () => {
    const { app, authRef } = createApp();
    const chatter = await supertest(app)
      .post("/api/chatters")
      .send({ displayName: "Creator", entityType: "user" })
      .expect(201);
    authRef.chatterId = chatter.body.id;

    const conv = await supertest(app)
      .post("/api/conversations")
      .send({
        createdBy: chatter.body.id,
        participants: [{ chatterId: chatter.body.id, role: "member" }],
      })
      .expect(201);
    expect(conv.body.id).toBeDefined();
    expect(conv.body.createdBy).toBe(chatter.body.id);
  });

  test("POST /api/conversations/:id/blocks sends block", async () => {
    const { app, authRef } = createApp();
    const chatter = await supertest(app)
      .post("/api/chatters")
      .send({ displayName: "Author", entityType: "user" })
      .expect(201);
    authRef.chatterId = chatter.body.id;

    const conv = await supertest(app)
      .post("/api/conversations")
      .send({
        createdBy: chatter.body.id,
        participants: [{ chatterId: chatter.body.id, role: "member" }],
      })
      .expect(201);

    const block = await supertest(app)
      .post(`/api/conversations/${conv.body.id}/blocks`)
      .send({ authorId: chatter.body.id, type: "text", body: "Hello" })
      .expect(201);
    expect(block.body.id).toBeDefined();
    expect(block.body.type).toBe("text");
    expect(block.body.body).toBe("Hello");
  });

  test("GET /api/policies/roles returns roles", async () => {
    const { app } = createApp();
    const res = await supertest(app).get("/api/policies/roles").expect(200);
    expect(res.body).toHaveProperty("roles");
    expect(Array.isArray(res.body.roles)).toBe(true);
  });
});
