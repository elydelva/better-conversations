import type { Chatter, Conversation, Participant } from "../types/index.js";
import type { HookResult, RefuseOptions } from "./common.js";

export interface ParticipantJoinCtx {
  conversation: Conversation;
  chatter: Chatter;
  role: string;
  participants: Participant[];
  /** The participant that just joined (for onParticipantAfterJoin) */
  participant?: Participant;
  /** Engine reference for plugin hooks that need to update state */
  engine?: unknown;
}

export interface ParticipantOutcomes {
  next: () => Promise<HookResult>;
  refuse: (reason: string, opts?: RefuseOptions) => Promise<HookResult>;
}
