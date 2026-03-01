import type {
  Block,
  Chatter,
  Conversation,
  Paginated,
  Participant,
  ResolvedPolicy,
} from "@better-conversation/core";

export const version = "0.0.0";

export {
  createBetterConversationsClient,
  type BetterConversationsClient,
} from "./createClient.js";
import { createBetterConversationsClient } from "./createClient.js";
export type {
  ClientOptions,
  ConversationClientPlugin,
  ClientPluginContext,
  ClientPluginResult,
} from "./plugins/types.js";

export interface ConversationClientOptions {
  baseUrl: string;
  chatterId?: string;
  fetchFn?: typeof globalThis.fetch;
}

/**
 * @deprecated Use createBetterConversationsClient with baseURL and plugins from @better-conversation/plugin-sse/client, etc.
 */
export function createConversationClient<_TEngine = unknown>(
  options: ConversationClientOptions
): ReturnType<typeof createBetterConversationsClient> {
  return createBetterConversationsClient({
    baseURL: options.baseUrl,
    fetchFn: options.fetchFn,
  });
}

export type ConversationClient = ReturnType<typeof createConversationClient>;
