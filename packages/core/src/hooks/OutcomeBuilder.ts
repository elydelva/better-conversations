import type { BlockInput } from "../types/index.js";
import type { BlockOutcomes } from "./BlockBeforeSend.js";
import type { DeleteOutcomes } from "./BlockDelete.js";
import type { ConversationCreateData, ConversationOutcomes } from "./ConversationCreate.js";
import type { ParticipantOutcomes } from "./ParticipantJoin.js";
import type { HookResult, RefuseOptions } from "./common.js";

export function createBlockOutcomes(): BlockOutcomes {
  return {
    next: () => Promise.resolve({ type: "next" }),
    refuse: (reason: string, opts?: RefuseOptions) =>
      Promise.resolve({ type: "refuse", reason, options: opts }),
    transform: (
      data: Partial<BlockInput> & Pick<BlockInput, "conversationId" | "authorId" | "type">
    ) => Promise.resolve({ type: "transform", data: data as BlockInput }),
    flag: (reason: string) => Promise.resolve({ type: "flag", reason }),
    defer: (asyncFn: () => Promise<void>) => Promise.resolve({ type: "defer", fn: asyncFn }),
    queue: () => Promise.resolve({ type: "queue" }),
  };
}

export function createDeleteOutcomes(): DeleteOutcomes {
  return {
    next: () => Promise.resolve({ type: "next" }),
    refuse: (reason: string, opts?: RefuseOptions) =>
      Promise.resolve({ type: "refuse", reason, options: opts }),
  };
}

export function createConversationOutcomes(): ConversationOutcomes {
  return {
    next: () => Promise.resolve({ type: "next" }),
    refuse: (reason: string, opts?: RefuseOptions) =>
      Promise.resolve({ type: "refuse", reason, options: opts }),
    transform: (data: Partial<ConversationCreateData>) =>
      Promise.resolve({
        type: "transform",
        data: data as BlockInput,
      }) as Promise<HookResult>,
  };
}

export function createParticipantOutcomes(): ParticipantOutcomes {
  return {
    next: () => Promise.resolve({ type: "next" }),
    refuse: (reason: string, opts?: RefuseOptions) =>
      Promise.resolve({ type: "refuse", reason, options: opts }),
  };
}
