import { describe, expect, test } from "bun:test";
import { getDefaultGlobal, mergePolicyLevels } from "./mergePolicy.js";

describe("mergePolicyLevels", () => {
  test("returns default global when no levels", () => {
    const result = mergePolicyLevels([]);
    expect(result.canJoinSelf).toBe(false);
    expect(result.allowedBlocks).toEqual(["text"]);
    expect(result.maxBlocksPerMinute).toBe(20);
  });

  test("override strategy: later level overrides earlier", () => {
    const result = mergePolicyLevels(
      [{ allowedBlocks: ["text"] }, { allowedBlocks: ["text", "media"] }],
      "override"
    );
    expect(result.allowedBlocks).toEqual(["text", "media"]);
  });

  test("override strategy: forces canJoinSelf false", () => {
    const result = mergePolicyLevels([{ canJoinSelf: true }], "override");
    expect(result.canJoinSelf).toBe(false);
  });

  test("restrict strategy: picks more restrictive for maxBlocksPerMinute", () => {
    const result = mergePolicyLevels(
      [{ maxBlocksPerMinute: 20 }, { maxBlocksPerMinute: 10 }],
      "restrict"
    );
    expect(result.maxBlocksPerMinute).toBe(10);
  });

  test("restrict strategy: readOnly true overrides false", () => {
    const result = mergePolicyLevels([{ readOnly: false }, { readOnly: true }], "restrict");
    expect(result.readOnly).toBe(true);
  });
});

describe("getDefaultGlobal", () => {
  test("returns default policy with canJoinSelf false", () => {
    const result = getDefaultGlobal();
    expect(result.canJoinSelf).toBe(false);
    expect(result.allowedBlocks).toEqual(["text"]);
  });
});
