import { ConversationError } from "../ConversationError.js";

export class ParticipantNotFoundError extends ConversationError {
  readonly code = "PARTICIPANT_NOT_FOUND";
  readonly statusCode = 404;

  constructor(conversationId: string, chatterId: string) {
    super(`Participant not found: chatter ${chatterId} in conversation ${conversationId}`, {
      expose: true,
      metadata: { conversationId, chatterId },
    });
  }
}
