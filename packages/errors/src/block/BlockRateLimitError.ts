import { ConversationError } from "../ConversationError.js";

export class BlockRateLimitError extends ConversationError {
  readonly code = "RATE_LIMIT";
  readonly statusCode = 429;

  constructor(retryAfter?: number) {
    super("Rate limit exceeded", { expose: true, retryAfter });
  }
}
