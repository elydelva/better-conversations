import type { ResolvedPolicy } from "@better-conversation/types";
import type { Block, Chatter, Conversation } from "../types/index.js";
import type { HookResult, RefuseOptions } from "./common.js";

export interface BlockDeleteCtx {
  block: Block;
  conversation: Conversation;
  author: Chatter;
  resolvedPolicy?: ResolvedPolicy;
  authorCanDelete?: boolean;
}

export interface DeleteOutcomes {
  next: () => Promise<HookResult>;
  refuse: (reason: string, opts?: RefuseOptions) => Promise<HookResult>;
}
