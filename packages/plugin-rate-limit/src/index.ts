import type {
  BlockBeforeSendCtx,
  ConversationEngine,
  ConversationPlugin,
} from "@better-conversation/core";
import { RateLimitService } from "./RateLimitService.js";
import { createInMemoryRateLimitStore } from "./createInMemoryRateLimitStore.js";

export { RateLimitService } from "./RateLimitService.js";
export { createInMemoryRateLimitStore } from "./createInMemoryRateLimitStore.js";
export type { RateLimitStore } from "./RateLimitStore.interface.js";

export interface RateLimitPluginOptions {
  store?: import("./RateLimitStore.interface.js").RateLimitStore;
  limit?: number;
  windowMs?: number;
}

/**
 * Creates the rate-limit plugin. Limits blocks per chatter per conversation within a time window.
 *
 * @example
 * betterConversation({
 *   adapter,
 *   plugins: [
 *     createRateLimitPlugin({ limit: 30, windowMs: 60_000 }),
 *   ],
 * });
 */
export function createRateLimitPlugin(options: RateLimitPluginOptions = {}): ConversationPlugin {
  const store = options.store ?? createInMemoryRateLimitStore();
  const limit = options.limit ?? 60;
  const windowMs = options.windowMs ?? 60_000;

  return {
    name: "rate-limit",
    version: "1.0.0",

    createServices: (_engine: ConversationEngine) => {
      const service = new RateLimitService({ store, limit, windowMs });
      return { rateLimit: service };
    },

    hooks: {
      onBlockBeforeSend: async (ctx: BlockBeforeSendCtx, outcomes) => {
        const engine = ctx.engine as ConversationEngine | undefined;
        if (!engine) return outcomes.next();
        const svc = engine.getPlugin<RateLimitService>("rateLimit");
        if (!svc) return outcomes.next();
        await svc.checkAndRecord(ctx.author.id, ctx.block.conversationId);
        return outcomes.next();
      },
    },
  };
}
