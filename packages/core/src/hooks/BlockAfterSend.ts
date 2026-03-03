import type { Block, Chatter, Conversation, Participant } from "../types/index.js";

export interface BlockAfterSendCtx<TBlock = Block> {
  block: TBlock;
  conversation: Conversation;
  author: Chatter;
  participants: Participant[];
  /** Engine reference for plugin hooks that need to access services */
  engine?: unknown;
  /** Whether the block is a reply in a thread */
  isThread: boolean;
  /** Whether this is the first reply in the thread (creating the thread) */
  isFirstReply: boolean;
}
