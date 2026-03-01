export interface RateLimitStore {
  /** Returns true if the key is under the limit, false if over. */
  check(key: string, limit: number, windowMs: number): Promise<boolean>;
  /** Records one increment for the key. */
  record(key: string): Promise<void>;
}
