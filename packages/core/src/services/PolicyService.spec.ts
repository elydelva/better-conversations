import { describe, expect, test } from "bun:test";
import { PolicyNotImplementedError } from "@better-conversation/errors";
import { PolicyService } from "./PolicyService.js";

describe("PolicyService", () => {
  const service = new PolicyService();

  test("setGlobal throws PolicyNotImplementedError", async () => {
    await expect(service.setGlobal({ allowedBlocks: ["text"] })).rejects.toThrow(
      PolicyNotImplementedError
    );
  });

  test("setRole throws PolicyNotImplementedError", async () => {
    await expect(service.setRole("member", { allowedBlocks: ["text"] })).rejects.toThrow(
      PolicyNotImplementedError
    );
  });

  test("resolve returns default policy", async () => {
    const result = await service.resolve("chatter_1");
    expect(result).toBeDefined();
    expect(result.canJoinSelf).toBe(false);
    expect(result.allowedBlocks).toContain("text");
    expect(result.maxBlocksPerMinute).toBe(20);
  });
});
