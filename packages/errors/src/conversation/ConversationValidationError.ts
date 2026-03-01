import { ConversationError } from "../ConversationError.js";

export class ConversationValidationError extends ConversationError {
  readonly code = "CONVERSATION_VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(message: string, field?: string) {
    super(message, { expose: true, metadata: field ? { field } : undefined });
  }
}
