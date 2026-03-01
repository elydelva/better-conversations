import { ConversationError } from "../ConversationError.js";

export class PolicyNotImplementedError extends ConversationError {
  readonly code = "NOT_IMPLEMENTED";
  readonly statusCode = 501;

  constructor(method: string) {
    super(`Not implemented: PolicyService.${method}`, { metadata: { method } });
  }
}
