import { describe, expect, test } from "bun:test";
import { ValidationError } from "@better-conversation/errors";
import { parseTypingBody } from "./schemas.js";

describe("parseTypingBody", () => {
  test("returns default 5000 when body is empty object", () => {
    const result = parseTypingBody({});
    expect(result.untilMs).toBe(5000);
  });

  test("returns until when valid number", () => {
    expect(parseTypingBody({ until: 100 }).untilMs).toBe(100);
    expect(parseTypingBody({ until: 10000 }).untilMs).toBe(10000);
  });

  test("returns until when valid string number", () => {
    expect(parseTypingBody({ until: "200" }).untilMs).toBe(200);
    expect(parseTypingBody({ until: "15000" }).untilMs).toBe(15000);
  });

  test("clamps until to 1–30000", () => {
    expect(parseTypingBody({ until: 0 }).untilMs).toBe(1);
    expect(parseTypingBody({ until: -100 }).untilMs).toBe(1);
    expect(parseTypingBody({ until: 50000 }).untilMs).toBe(30000);
    expect(parseTypingBody({ until: 1 }).untilMs).toBe(1);
    expect(parseTypingBody({ until: 30000 }).untilMs).toBe(30000);
  });

  test("throws ValidationError when until is invalid string", () => {
    expect(() => parseTypingBody({ until: "abc" })).toThrow(ValidationError);
    expect(() => parseTypingBody({ until: "abc" })).toThrow(/valid number/);
  });

  test("throws ValidationError when until is empty string", () => {
    expect(() => parseTypingBody({ until: "" })).toThrow(ValidationError);
  });

  test("treats null body as empty object (default until)", () => {
    const result = parseTypingBody(null);
    expect(result.untilMs).toBe(5000);
  });

  test("throws ValidationError when body is not object", () => {
    expect(() => parseTypingBody("string")).toThrow(ValidationError);
    expect(() => parseTypingBody("string")).toThrow(/object/);
    expect(() => parseTypingBody([])).toThrow(ValidationError);
    expect(() => parseTypingBody(42)).toThrow(ValidationError);
  });
});
