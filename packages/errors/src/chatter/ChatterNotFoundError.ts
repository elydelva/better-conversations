import { ConversationError } from "../ConversationError.js";

export class ChatterNotFoundError extends ConversationError {
  readonly code = "CHATTER_NOT_FOUND";
  readonly statusCode = 404;

  constructor(id?: string, entityType?: string, entityId?: string) {
    super(
      `Chatter not found${id ? `: ${id}` : entityType && entityId ? ` for ${entityType}:${entityId}` : ""}`,
      {
        metadata: id ? { id } : entityType && entityId ? { entityType, entityId } : undefined,
      }
    );
  }
}
