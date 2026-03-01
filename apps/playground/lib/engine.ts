import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { betterConversation, createInMemoryAuditStore } from "@better-conversation/core";
import type { ConversationEngine } from "@better-conversation/core";
import { createHistoryPlugin } from "@better-conversation/plugin-history";
import { createPresencePlugin } from "@better-conversation/plugin-presence";
import { createRateLimitPlugin } from "@better-conversation/plugin-rate-limit";
import { createSsePlugin } from "@better-conversation/plugin-sse";
import { db } from "./db";

const adapter = drizzleAdapter(db, { provider: "sqlite" });

let engine: ConversationEngine | null = null;

export async function getEngine(): Promise<ConversationEngine> {
  if (!engine) {
    engine = betterConversation({
      adapter,
      audit: { store: createInMemoryAuditStore() },
      policies: {},
      plugins: [
        createSsePlugin(),
        createPresencePlugin(),
        createHistoryPlugin(),
        createRateLimitPlugin({ limit: 60, windowMs: 60_000 }),
      ],
    });
  }
  return engine;
}
