import { ConversationError } from "../ConversationError.js";

/**
 * Generic validation error for API body/input validation (e.g. Zod).
 * metadata.issues can contain structured validation details (ZodIssue[]).
 */
export class ValidationError extends ConversationError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(message: string, options?: { metadata?: { issues?: unknown[] } }) {
    super(message, { expose: true, metadata: options?.metadata });
  }
}
