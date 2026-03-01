import type { Chatter, Conversation } from "../types/index.js";
import type { HookResult, RefuseOptions } from "./common.js";

export interface StatusChangeCtx {
  conversation: Conversation;
  previousStatus: string;
  nextStatus: string;
  triggeredBy: Chatter;
}

export interface StatusOutcomes {
  next: () => Promise<HookResult>;
  refuse: (reason: string, opts?: RefuseOptions) => Promise<HookResult>;
}
