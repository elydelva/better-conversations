import { describe, expect, test } from "bun:test";
import { betterConversation, dispatch } from "@better-conversation/core";
import {
  createMockAdapter,
  createMockChatter,
  createMockConversation,
  createMockParticipant,
} from "@better-conversation/core/fixtures";
import { createPresencePlugin } from "./index.js";

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

describe("plugin-presence", () => {
  test("createPresencePlugin returns plugin with name, schemaContribution, routes, createServices", () => {
    const presencePlugin = createPresencePlugin();
    expect(presencePlugin.name).toBe("presence");
    expect(presencePlugin.schemaContribution).toBeDefined();
    expect(presencePlugin.schemaContribution?.extensions?.[0].extendTable).toBe("participants");
    expect(presencePlugin.routes?.length).toBeGreaterThanOrEqual(2);
    expect(presencePlugin.createServices).toBeDefined();
  });

  test("PATCH .../participants/:chatterId/read returns 204 when plugin is used", async () => {
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        find: async () => ({
          id: "p1",
          conversationId: "c1",
          chatterId: "ch1",
          role: "member",
          joinedAt: new Date(),
          leftAt: null,
          metadata: null,
        }),
        update: async () => ({
          id: "p1",
          conversationId: "c1",
          chatterId: "ch1",
          role: "member",
          joinedAt: new Date(),
          leftAt: null,
          lastReadAt: new Date(),
          metadata: null,
        }),
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "PATCH",
      path: "/conversations/c1/participants/ch1/read",
      params: { id: "c1", chatterId: "ch1" },
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(204);
  });

  test("PATCH .../participants/:chatterId/read returns 404 when participant not found", async () => {
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        find: async () => null,
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "PATCH",
      path: "/conversations/c1/participants/unknown/read",
      params: { id: "c1", chatterId: "unknown" },
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: "PARTICIPANT_NOT_FOUND" });
  });

  test("PATCH .../participants/:chatterId/typing returns 204 with valid body", async () => {
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        find: async () =>
          createMockParticipant({ id: "p1", conversationId: "c1", chatterId: "ch1" }),
        update: async (id: string, data: unknown) =>
          createMockParticipant({
            id,
            conversationId: "c1",
            chatterId: "ch1",
            typingUntil: (data as { typingUntil?: Date }).typingUntil ?? null,
          }),
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "PATCH",
      path: "/conversations/c1/participants/ch1/typing",
      params: { id: "c1", chatterId: "ch1" },
      query: {},
      body: { until: 5000 },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(204);
  });

  test("PATCH .../participants/:chatterId/typing returns 400 when until is invalid", async () => {
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        find: async () => createMockParticipant(),
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "PATCH",
      path: "/conversations/c1/participants/ch1/typing",
      params: { id: "c1", chatterId: "ch1" },
      query: {},
      body: { until: "abc" },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "VALIDATION_ERROR" });
  });

  test("PATCH .../participants/:chatterId/typing returns 404 when participant not found", async () => {
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        find: async () => null,
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "PATCH",
      path: "/conversations/c1/participants/unknown/typing",
      params: { id: "c1", chatterId: "unknown" },
      query: {},
      body: { until: 5000 },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: "PARTICIPANT_NOT_FOUND" });
  });

  test("GET .../participants/presence returns array when plugin is used", async () => {
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        list: async () => [
          {
            id: "p1",
            conversationId: "c1",
            chatterId: "ch1",
            role: "member",
            joinedAt: new Date(),
            leftAt: null,
            metadata: null,
          },
        ],
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "GET",
      path: "/conversations/c1/participants/presence",
      params: { id: "c1" },
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET presence filters out left participants", async () => {
    const now = new Date();
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        list: async () => [
          createMockParticipant({
            id: "p1",
            chatterId: "ch1",
            leftAt: null,
            lastReadAt: now,
            lastSeenAt: now,
          }),
          createMockParticipant({
            id: "p2",
            chatterId: "ch2",
            leftAt: now,
            lastReadAt: now,
          }),
        ],
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "GET",
      path: "/conversations/c1/participants/presence",
      params: { id: "c1" },
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    const list = res.body as Array<{ chatterId: string }>;
    expect(list).toHaveLength(1);
    expect(list[0]?.chatterId).toBe("ch1");
  });

  test("GET presence returns typingUntil as null when expired", async () => {
    const past = new Date(Date.now() - 5000);
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        list: async () => [
          createMockParticipant({
            id: "p1",
            chatterId: "ch1",
            leftAt: null,
            typingUntil: past,
          }),
        ],
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "GET",
      path: "/conversations/c1/participants/presence",
      params: { id: "c1" },
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    const list = res.body as Array<{ chatterId: string; typingUntil: Date | null }>;
    expect(list[0]?.typingUntil).toBeNull();
  });

  test("GET presence returns typingUntil when not expired", async () => {
    const future = new Date(Date.now() + 10000);
    const adapter = createMockAdapter({
      participants: {
        ...createMockAdapter().participants,
        list: async () => [
          createMockParticipant({
            id: "p1",
            chatterId: "ch1",
            leftAt: null,
            typingUntil: future,
          }),
        ],
      },
    });
    const engine = betterConversation({ adapter, plugins: [createPresencePlugin()] });
    const req = {
      method: "GET",
      path: "/conversations/c1/participants/presence",
      params: { id: "c1" },
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    const list = res.body as Array<{ chatterId: string; typingUntil: Date | null }>;
    expect(list[0]?.typingUntil).toEqual(future);
  });

  test("onParticipantAfterJoin updates lastSeenAt when participant joins", async () => {
    const addedParticipant = createMockParticipant({
      id: "p_new",
      conversationId: "c1",
      chatterId: "ch_new",
    });
    let lastUpdatePayload: { lastSeenAt?: Date } | null = null;
    const adapter = createMockAdapter({
      conversations: {
        ...createMockAdapter().conversations,
        find: async () => createMockConversation({ id: "c1" }),
      },
      chatters: {
        ...createMockAdapter().chatters,
        find: async () => createMockChatter({ id: "ch_new" }),
      },
      participants: {
        ...createMockAdapter().participants,
        add: async () => addedParticipant,
        list: async () => [addedParticipant],
        update: async (_id: string, data: unknown) => {
          lastUpdatePayload = data as { lastSeenAt?: Date };
          return { ...addedParticipant, ...data };
        },
      },
    });
    const engine = betterConversation({
      adapter,
      plugins: [createPresencePlugin()],
      security: permissiveSecurity,
    });
    const req = {
      method: "POST",
      path: "/conversations/c1/participants",
      params: { id: "c1" },
      query: {},
      body: { chatterId: "ch_new", role: "member" },
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(201);
    expect(lastUpdatePayload).not.toBeNull();
    expect(lastUpdatePayload).toHaveProperty("lastSeenAt");
    expect(lastUpdatePayload?.lastSeenAt).toBeInstanceOf(Date);
  });
});
