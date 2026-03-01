import type { DatabaseAdapter } from "../adapter/index.js";
import type { ResolvedPolicy } from "../policy/index.js";
import type { BlockInput, Chatter, Conversation, Participant } from "../types/index.js";
import type { HookResult, RefuseOptions } from "./common.js";

export interface BlockBeforeSendCtx<TBlockInput = BlockInput> {
  block: TBlockInput;
  conversation: Conversation;
  author: Chatter;
  participants: Participant[];
  adapter: DatabaseAdapter;
  isThread: boolean;
  isFirstReply: boolean;
  resolvedPolicy?: ResolvedPolicy;
}

export interface BlockOutcomes<TBlockInput = BlockInput> {
  next: () => Promise<HookResult>;
  refuse: (reason: string, opts?: RefuseOptions) => Promise<HookResult>;
  transform: (
    data: Partial<BlockInput> & Pick<BlockInput, "conversationId" | "authorId" | "type">
  ) => Promise<HookResult>;
  flag: (reason: string) => Promise<HookResult>;
  defer: (asyncFn: () => Promise<void>) => Promise<HookResult>;
  queue: () => Promise<HookResult>;
}
