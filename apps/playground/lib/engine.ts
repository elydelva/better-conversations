import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { betterConversation } from "@better-conversation/core";
import type { ConversationEngine } from "@better-conversation/core";
import { ssePlugin } from "@better-conversation/plugin-sse";
import { db } from "./db";

const adapter = drizzleAdapter(db, { provider: "sqlite" });

let engine: ConversationEngine | null = null;

export async function getEngine(): Promise<ConversationEngine> {
  if (!engine) {
    engine = betterConversation({
      adapter,
      policies: {},
      plugins: [ssePlugin],
    });
    await engine.init();
  }
  return engine;
}
