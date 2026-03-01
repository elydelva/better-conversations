import { ConversationError } from "../ConversationError.js";

export class BlockValidationError extends ConversationError {
  readonly code = "BLOCK_VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(message: string, field?: string) {
    super(message, { expose: true, metadata: field ? { field } : undefined });
  }
}
