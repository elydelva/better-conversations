import type { Conversation, Participant } from "../types/index.js";

export interface ConversationAfterCreateCtx {
  conversation: Conversation;
  participants: Participant[];
}
