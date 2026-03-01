import type { Chatter, Conversation, Participant } from "../types/index.js";

export interface ParticipantLeaveCtx {
  conversation: Conversation;
  participant: Participant;
  chatter: Chatter;
}
