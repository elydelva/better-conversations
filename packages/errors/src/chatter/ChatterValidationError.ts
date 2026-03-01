import { ConversationError } from "../ConversationError.js";

export class ChatterValidationError extends ConversationError {
  readonly code = "CHATTER_VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(message: string, field?: string) {
    super(message, { expose: true, metadata: field ? { field } : undefined });
  }
}
