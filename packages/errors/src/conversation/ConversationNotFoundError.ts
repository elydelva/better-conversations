import { ConversationError } from "../ConversationError.js";

export class ConversationNotFoundError extends ConversationError {
  readonly code = "CONVERSATION_NOT_FOUND";
  readonly statusCode = 404;

  constructor(id?: string) {
    super(`Conversation not found${id ? `: ${id}` : ""}`, { metadata: id ? { id } : undefined });
  }
}
