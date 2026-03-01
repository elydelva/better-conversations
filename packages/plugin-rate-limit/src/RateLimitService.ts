import { BlockRateLimitError } from "@better-conversation/errors";
import type { RateLimitStore } from "./RateLimitStore.interface.js";

export interface RateLimitServiceConfig {
  store: RateLimitStore;
  /** Max blocks per window (default 60) */
  limit?: number;
  /** Window in milliseconds (default 60_000) */
  windowMs?: number;
}

export class RateLimitService {
  constructor(private readonly config: RateLimitServiceConfig) {
    this.limit = config.limit ?? 60;
    this.windowMs = config.windowMs ?? 60_000;
  }

  private readonly limit: number;
  private readonly windowMs: number;

  /**
   * Checks if the chatter is under the rate limit for the conversation,
   * then records the request. Throws BlockRateLimitError if over limit.
   */
  async checkAndRecord(chatterId: string, conversationId: string): Promise<void> {
    const key = `${chatterId}:${conversationId}`;
    const allowed = await this.config.store.check(key, this.limit, this.windowMs);
    if (!allowed) {
      throw new BlockRateLimitError(Math.ceil(this.windowMs / 1000));
    }
    await this.config.store.record(key);
  }
}
