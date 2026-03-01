import { ConversationError } from "./ConversationError.js";
export { ConversationError };
export { ChatterNotFoundError } from "./chatter/ChatterNotFoundError.js";
export { ChatterValidationError } from "./chatter/ChatterValidationError.js";
export { ConversationNotFoundError } from "./conversation/ConversationNotFoundError.js";
export { ConversationArchivedError } from "./conversation/ConversationArchivedError.js";
export { ConversationValidationError } from "./conversation/ConversationValidationError.js";
export { ParticipantNotFoundError } from "./participant/ParticipantNotFoundError.js";
export { ParticipantAlreadyJoinedError } from "./participant/ParticipantAlreadyJoinedError.js";
export { ParticipantValidationError } from "./participant/ParticipantValidationError.js";
export { BlockNotFoundError } from "./block/BlockNotFoundError.js";
export { BlockRefusedError } from "./block/BlockRefusedError.js";
export { BlockValidationError } from "./block/BlockValidationError.js";
export { BlockRateLimitError } from "./block/BlockRateLimitError.js";
export { PermissionDeniedError } from "./permission/PermissionDeniedError.js";
export { PolicyNotImplementedError } from "./policy/PolicyNotImplementedError.js";
export { ValidationError } from "./validation/ValidationError.js";

export function isConversationError(err: unknown): err is ConversationError {
  return err instanceof ConversationError;
}

export interface ErrorJsonPayload {
  code: string;
  message: string;
  retryAfter?: number;
  issues?: unknown[];
}

export function toJsonPayload(err: ConversationError): ErrorJsonPayload {
  const payload: ErrorJsonPayload = {
    code: err.code,
    message: err.message,
  };
  if (err.retryAfter != null) {
    payload.retryAfter = err.retryAfter;
  }
  if (err.metadata?.issues != null) {
    payload.issues = err.metadata.issues as unknown[];
  }
  return payload;
}
