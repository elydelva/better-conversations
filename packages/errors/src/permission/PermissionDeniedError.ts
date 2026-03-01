import { ConversationError } from "../ConversationError.js";

export class PermissionDeniedError extends ConversationError {
  readonly code = "FORBIDDEN";
  readonly statusCode = 403;

  constructor(action: string, scope?: string) {
    super(`Permission denied: ${action}${scope ? ` (${scope})` : ""}`, {
      expose: true,
      metadata: { action, scope },
    });
  }
}
