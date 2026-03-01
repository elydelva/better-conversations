import { describe, expect, test } from "bun:test";
import * as blocks from "./index.js";

describe("blocks", () => {
  test("exports media block", () => {
    expect(blocks.mediaBlock).toBeDefined();
    expect(typeof blocks.mediaBlock).toBe("string");
  });

  test("exports reaction block", () => {
    expect(blocks.reactionBlock).toBeDefined();
    expect(typeof blocks.reactionBlock).toBe("string");
  });

  test("exports embed block", () => {
    expect(blocks.embedBlock).toBeDefined();
    expect(typeof blocks.embedBlock).toBe("string");
  });

  test("exports poll block", () => {
    expect(blocks.pollBlock).toBeDefined();
    expect(typeof blocks.pollBlock).toBe("string");
  });
});
