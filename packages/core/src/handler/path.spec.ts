import { describe, expect, test } from "bun:test";
import { matchPath } from "./path.js";

describe("matchPath", () => {
  test("returns params for /chatters/:id", () => {
    const result = matchPath("/chatters/:id", "/chatters/abc123");
    expect(result.matches).toBe(true);
    expect(result.params).toEqual({ id: "abc123" });
  });

  test("rejects wrong segment count", () => {
    const result = matchPath("/chatters/:id", "/chatters");
    expect(result.matches).toBe(false);
    expect(result.params).toEqual({});
  });

  test("rejects wrong segment count when path has extra segments", () => {
    const result = matchPath("/chatters/:id", "/chatters/abc/conversations");
    expect(result.matches).toBe(false);
    expect(result.params).toEqual({});
  });

  test("handles empty path", () => {
    const result = matchPath("", "");
    expect(result.matches).toBe(true);
    expect(result.params).toEqual({});
  });

  test("extracts multiple params", () => {
    const result = matchPath(
      "/conversations/:id/participants/:chatterId",
      "/conversations/conv1/participants/ch1"
    );
    expect(result.matches).toBe(true);
    expect(result.params).toEqual({ id: "conv1", chatterId: "ch1" });
  });

  test("rejects mismatched literal segments", () => {
    const result = matchPath("/chatters/:id", "/conversations/abc123");
    expect(result.matches).toBe(false);
    expect(result.params).toEqual({});
  });

  test("handles leading slash in path", () => {
    const result = matchPath("/chatters/:id", "/chatters/xyz");
    expect(result.matches).toBe(true);
    expect(result.params).toEqual({ id: "xyz" });
  });
});
