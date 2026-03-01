import { describe, expect, test } from "bun:test";
import { createBlockOutcomes, createDeleteOutcomes } from "./OutcomeBuilder.js";

describe("createBlockOutcomes", () => {
  test("next returns correct HookResult shape", async () => {
    const outcomes = createBlockOutcomes();
    const result = await outcomes.next();
    expect(result).toEqual({ type: "next" });
  });

  test("refuse returns correct HookResult shape", async () => {
    const outcomes = createBlockOutcomes();
    const result = await outcomes.refuse("not allowed");
    expect(result).toEqual({
      type: "refuse",
      reason: "not allowed",
      options: undefined,
    });
  });

  test("transform returns correct HookResult shape", async () => {
    const outcomes = createBlockOutcomes();
    const result = await outcomes.transform({
      conversationId: "c1",
      authorId: "a1",
      type: "text",
      body: " transformed",
    });
    expect(result).toEqual({
      type: "transform",
      data: expect.objectContaining({
        conversationId: "c1",
        authorId: "a1",
        type: "text",
        body: " transformed",
      }),
    });
  });

  test("flag returns correct HookResult shape", async () => {
    const outcomes = createBlockOutcomes();
    const result = await outcomes.flag("suspicious");
    expect(result).toEqual({ type: "flag", reason: "suspicious" });
  });

  test("defer returns correct HookResult shape", async () => {
    const outcomes = createBlockOutcomes();
    const fn = async () => {};
    const result = await outcomes.defer(fn);
    expect(result).toEqual({ type: "defer", fn });
  });

  test("queue returns correct HookResult shape", async () => {
    const outcomes = createBlockOutcomes();
    const result = await outcomes.queue();
    expect(result).toEqual({ type: "queue" });
  });
});

describe("createDeleteOutcomes", () => {
  test("next returns correct HookResult shape", async () => {
    const outcomes = createDeleteOutcomes();
    const result = await outcomes.next();
    expect(result).toEqual({ type: "next" });
  });

  test("refuse returns correct HookResult shape", async () => {
    const outcomes = createDeleteOutcomes();
    const result = await outcomes.refuse("cannot delete");
    expect(result).toEqual({
      type: "refuse",
      reason: "cannot delete",
      options: undefined,
    });
  });
});
