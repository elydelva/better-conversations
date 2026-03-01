import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { betterConversation, createInMemoryAuditStore } from "@better-conversation/core";
import type { ConversationEngine } from "@better-conversation/core";
import { historyPlugin } from "@better-conversation/plugin-history";
import { presencePlugin } from "@better-conversation/plugin-presence";
import { createRateLimitPlugin } from "@better-conversation/plugin-rate-limit";
import { ssePlugin } from "@better-conversation/plugin-sse";
import { db } from "./db";

const adapter = drizzleAdapter(db, { provider: "sqlite" });

const plugins = [ssePlugin, presencePlugin, historyPlugin, createRateLimitPlugin()];

let engine: ConversationEngine | null = null;

export async function getEngine(): Promise<ConversationEngine> {
  if (!engine) {
    engine = betterConversation({
      adapter,
      audit: { store: createInMemoryAuditStore() },
      policies: {},
      plugins,
    });
    await engine.init();
  }
  return engine;
}
