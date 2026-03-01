import { ConversationError } from "../ConversationError.js";

export class BlockNotFoundError extends ConversationError {
  readonly code = "BLOCK_NOT_FOUND";
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Block not found: ${id}`, { metadata: { id } });
  }
}
