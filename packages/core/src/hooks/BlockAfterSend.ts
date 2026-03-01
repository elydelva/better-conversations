import type { Block, Chatter, Conversation, Participant } from "../types/index.js";

export interface BlockAfterSendCtx<TBlock = Block> {
  block: TBlock;
  conversation: Conversation;
  author: Chatter;
  participants: Participant[];
}
