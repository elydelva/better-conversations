import { mongodbAdapter } from "@better-conversation/adapter-mongodb";
import { betterConversation } from "@better-conversation/core";
import type { ConversationEngine } from "@better-conversation/core";

const adapter = mongodbAdapter();

let engine: ConversationEngine | null = null;

export async function getEngine(): Promise<ConversationEngine> {
  if (!engine) {
    engine = betterConversation({ adapter });
    await engine.init();
  }
  return engine;
}
