/**
 * Conversation config - used by app and by CLI (bc generate, bc migrate).
 * Export conv for CLI; use getEngine() for handlers (calls init).
 */
import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { betterConversation } from "@better-conversation/core";
import type { ConversationEngine } from "@better-conversation/core";
import { db } from "./db";

const adapter = drizzleAdapter(db, { provider: "sqlite" });

export const conv = betterConversation({ adapter });

let _initDone = false;

export async function getEngine(): Promise<ConversationEngine> {
  if (!_initDone) {
    await conv.init();
    _initDone = true;
  }
  return conv;
}
