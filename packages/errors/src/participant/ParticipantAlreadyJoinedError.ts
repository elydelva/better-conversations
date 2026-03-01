import { ConversationError } from "../ConversationError.js";

export class ParticipantAlreadyJoinedError extends ConversationError {
  readonly code = "PARTICIPANT_ALREADY_JOINED";
  readonly statusCode = 409;

  constructor(conversationId: string, chatterId: string) {
    super(`Participant already joined: chatter ${chatterId} in conversation ${conversationId}`, {
      expose: true,
      metadata: { conversationId, chatterId },
    });
  }
}
