import { ConversationError } from "../ConversationError.js";

export class BlockRefusedError extends ConversationError {
  readonly code: string;
  readonly statusCode = 403;

  constructor(reason: string, options?: { code?: string; expose?: boolean; retryAfter?: number }) {
    super(reason, {
      expose: options?.expose ?? true,
      retryAfter: options?.retryAfter,
    });
    this.code = options?.code ?? "BLOCK_REFUSED";
  }
}
