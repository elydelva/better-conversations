import { describe, expect, test } from "bun:test";
import type { PolicyAdapter } from "../adapter/index.js";
import { PolicyService } from "./PolicyService.js";

function createMockPolicyAdapter(overrides?: Partial<PolicyAdapter>): PolicyAdapter {
  return {
    find: async () => null,
    upsert: async () => {},
    delete: async () => {},
    ...overrides,
  };
}

describe("PolicyService", () => {
  test("setGlobal delegates to adapter.upsert", async () => {
    const upsertCalls: Array<{ level: string; scopeId: string; policy: unknown }> = [];
    const adapter = createMockPolicyAdapter({
      upsert: async (level, scopeId, policy) => {
        upsertCalls.push({ level, scopeId, policy });
      },
    });
    const service = new PolicyService({ adapter });
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
    const adapter = createMockPolicyAdapter({
      upsert: async (level, scopeId) => {
        upsertCalls.push({ level, scopeId });
      },
    });
    const service = new PolicyService({ adapter });
    await service.setRole("member", { allowedBlocks: ["text"] });
    expect(upsertCalls[0]).toEqual({ level: "role", scopeId: "member" });
  });

  test("resolve returns default policy", async () => {
    const adapter = createMockPolicyAdapter();
    const service = new PolicyService({ adapter });
    const result = await service.resolve("chatter_1");
    expect(result).toBeDefined();
    expect(result.canJoinSelf).toBe(false);
    expect(result.allowedBlocks).toContain("text");
    expect(result.maxBlocksPerMinute).toBe(20);
  });
});
