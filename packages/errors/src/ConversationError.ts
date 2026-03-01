export abstract class ConversationError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly expose?: boolean;
  readonly retryAfter?: number;
  readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    options?: { expose?: boolean; retryAfter?: number; metadata?: Record<string, unknown> }
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    this.expose = options?.expose;
    this.retryAfter = options?.retryAfter;
    this.metadata = options?.metadata;
  }
}
