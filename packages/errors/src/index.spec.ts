import { describe, expect, test } from "bun:test";
import {
  BlockNotFoundError,
  BlockRateLimitError,
  BlockRefusedError,
  BlockValidationError,
  ChatterNotFoundError,
  ChatterValidationError,
  ConversationArchivedError,
  ConversationNotFoundError,
  ConversationValidationError,
  ParticipantAlreadyJoinedError,
  ParticipantNotFoundError,
  ParticipantValidationError,
  PermissionDeniedError,
  PolicyNotImplementedError,
  isConversationError,
  toJsonPayload,
} from "./index.js";

const errorClasses = [
  ChatterNotFoundError,
  ChatterValidationError,
  ConversationNotFoundError,
  ConversationArchivedError,
  ConversationValidationError,
  ParticipantNotFoundError,
  ParticipantAlreadyJoinedError,
  ParticipantValidationError,
  BlockNotFoundError,
  BlockRefusedError,
  BlockValidationError,
  BlockRateLimitError,
  PermissionDeniedError,
  PolicyNotImplementedError,
];

describe("isConversationError", () => {
  test("returns true for all 14 subclasses", () => {
    const instances = [
      new ChatterNotFoundError("id"),
      new ChatterValidationError("msg"),
      new ConversationNotFoundError("id"),
      new ConversationArchivedError("id"),
      new ConversationValidationError("msg"),
      new ParticipantNotFoundError("c1", "ch1"),
      new ParticipantAlreadyJoinedError("c1", "ch1"),
      new ParticipantValidationError("msg"),
      new BlockNotFoundError("id"),
      new BlockRefusedError("reason"),
      new BlockValidationError("msg"),
      new BlockRateLimitError(),
      new PermissionDeniedError("action"),
      new PolicyNotImplementedError("feature"),
    ];
    for (const err of instances) {
      expect(isConversationError(err)).toBe(true);
    }
  });

  test("returns false for Error", () => {
    expect(isConversationError(new Error("generic"))).toBe(false);
  });

  test("returns false for string", () => {
    expect(isConversationError("oops")).toBe(false);
  });

  test("returns false for null", () => {
    expect(isConversationError(null)).toBe(false);
  });
});

describe("toJsonPayload", () => {
  test("returns code and message", () => {
    const err = new BlockRefusedError("refused");
    const payload = toJsonPayload(err);
    expect(payload).toMatchObject({ code: expect.any(String), message: "refused" });
  });

  test("includes retryAfter when set", () => {
    const err = new BlockRefusedError("refused", { retryAfter: 60 });
    const payload = toJsonPayload(err);
    expect(payload.retryAfter).toBe(60);
  });

  test("omits retryAfter when not set", () => {
    const err = new BlockRefusedError("refused");
    const payload = toJsonPayload(err);
    expect(payload).not.toHaveProperty("retryAfter");
  });
});

describe("error classes", () => {
  test("each error has code and statusCode", () => {
    const instances = [
      new ChatterNotFoundError("id"),
      new ChatterValidationError("msg"),
      new ConversationNotFoundError("id"),
      new ConversationArchivedError("id"),
      new ConversationValidationError("msg"),
      new ParticipantNotFoundError("c1", "ch1"),
      new ParticipantAlreadyJoinedError("c1", "ch1"),
      new ParticipantValidationError("msg"),
      new BlockNotFoundError("id"),
      new BlockRefusedError("reason"),
      new BlockValidationError("msg"),
      new BlockRateLimitError(),
      new PermissionDeniedError("action"),
      new PolicyNotImplementedError("feature"),
    ];
    for (const err of instances) {
      expect(err.code).toBeDefined();
      expect(typeof err.code).toBe("string");
      expect(err.statusCode).toBeDefined();
      expect(typeof err.statusCode).toBe("number");
    }
  });
});
