import { prismaAdapter } from "@better-conversation/adapter-prisma";
import { betterConversation } from "@better-conversation/core";
import type { ConversationEngine } from "@better-conversation/core";
import { prisma } from "./db";

const adapter = prismaAdapter(prisma);

let engine: ConversationEngine | null = null;

export async function getEngine(): Promise<ConversationEngine> {
  if (!engine) {
    engine = betterConversation({ adapter });
    await engine.init();
  }
  return engine;
}
