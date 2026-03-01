import { describe, expect, test } from "bun:test";
import { createMockAdapter, createMockParticipant } from "../fixtures/index.js";
import { defaultRoleRegistry } from "../registry/defaultRoleRegistry.js";
import { PolicyService } from "./PolicyService.js";

describe("PolicyService", () => {
  test("setGlobal delegates to adapter.upsert", async () => {
    const upsertCalls: Array<{ level: string; scopeId: string; policy: unknown }> = [];
    const adapter = createMockAdapter({
      policies: {
        find: async () => null,
        upsert: async (level, scopeId, policy) => {
          upsertCalls.push({ level, scopeId, policy });
        },
        delete: async () => {},
      },
    });
    const service = new PolicyService({
      adapter,
      roleRegistry: defaultRoleRegistry,
    });
    await service.setGlobal({ allowedBlocks: ["text", "media"] });
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).toEqual({
      level: "global",
      scopeId: "global",
      policy: { allowedBlocks: ["text", "media"] },
    });
  });

  test("setRole delegates to adapter.upsert", async () => {
    const upsertCalls: Array<{ level: string; scopeId: string }> = [];
    const adapter = createMockAdapter({
      policies: {
        find: async () => null,
        upsert: async (level, scopeId) => {
          upsertCalls.push({ level, scopeId });
        },
        delete: async () => {},
      },
    });
    const service = new PolicyService({
      adapter,
      roleRegistry: defaultRoleRegistry,
    });
    await service.setRole("member", { allowedBlocks: ["text"] });
    expect(upsertCalls[0]).toEqual({ level: "role", scopeId: "member" });
  });

  test("resolve returns merged policy with canJoinSelf false", async () => {
    const adapter = createMockAdapter({
      participants: {
        list: async () => [],
        find: async () => createMockParticipant({ role: "member" }),
        add: async () => createMockParticipant(),
        update: async () => createMockParticipant(),
        remove: async () => {},
      },
    });
    const service = new PolicyService({
      adapter,
      roleRegistry: defaultRoleRegistry,
    });
    const result = await service.resolve("ch1", "c1");
    expect(result).toBeDefined();
    expect(result.canJoinSelf).toBe(false);
    expect(result.allowedBlocks).toContain("text");
    expect(result.maxBlocksPerMinute).toBe(20);
  });

  test("resolve merges role policy from participant", async () => {
    const adapter = createMockAdapter({
      participants: {
        list: async () => [],
        find: async () => createMockParticipant({ role: "owner" }),
        add: async () => createMockParticipant(),
        update: async () => createMockParticipant(),
        remove: async () => {},
      },
    });
    const service = new PolicyService({
      adapter,
      roleRegistry: defaultRoleRegistry,
    });
    const result = await service.resolve("ch1", "c1");
    expect(result.allowedBlocks).toBe("*");
    expect(result.maxBlocksPerMinute).toBe(60);
  });
});
