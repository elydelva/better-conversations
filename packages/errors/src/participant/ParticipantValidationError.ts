import { ConversationError } from "../ConversationError.js";

export class ParticipantValidationError extends ConversationError {
  readonly code = "PARTICIPANT_VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(message: string, field?: string) {
    super(message, { expose: true, metadata: field ? { field } : undefined });
  }
}
