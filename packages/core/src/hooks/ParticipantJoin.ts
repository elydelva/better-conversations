import type { Chatter, Conversation, Participant } from "../types/index.js";
import type { HookResult, RefuseOptions } from "./common.js";

export interface ParticipantJoinCtx {
  conversation: Conversation;
  chatter: Chatter;
  role: string;
  participants: Participant[];
}

export interface ParticipantOutcomes {
  next: () => Promise<HookResult>;
  refuse: (reason: string, opts?: RefuseOptions) => Promise<HookResult>;
}
