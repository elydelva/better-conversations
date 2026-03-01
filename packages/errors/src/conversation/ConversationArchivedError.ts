import { ConversationError } from "../ConversationError.js";

export class ConversationArchivedError extends ConversationError {
  readonly code = "CONV_ARCHIVED";
  readonly statusCode = 403;

  constructor(id: string) {
    super(`Conversation is archived: ${id}`, { expose: true, metadata: { id } });
  }
}
