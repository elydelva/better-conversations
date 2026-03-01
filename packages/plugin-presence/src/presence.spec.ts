import { describe, expect, test } from "bun:test";
import { betterConversation, dispatch } from "@better-conversation/core";
import { createMockAdapter } from "@better-conversation/core/fixtures";
import { createPresencePlugin } from "./index.js";

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
});
