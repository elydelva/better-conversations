/**
 * Shared context for MongoDB adapter parts.
 * To be implemented when adapter is built.
 */
import type { createAdapterHelpers } from "@better-conversation/core";

export interface MongoAdapterContext {
  // MongoClient/Collection when implemented
  helpers: ReturnType<typeof createAdapterHelpers>;
}
