import type { ConversationPlugin } from "@better-conversation/core";
import { handleConversationsStream } from "./streamHandler.js";

export type SsePluginOptions = Record<string, never>;

/**
 * Creates the SSE plugin. Enables Server-Sent Events for real-time block updates.
 * Registers GET /conversations/:id/stream (polling-based, Edge-compatible).
 *
 * @example
 * betterConversation({
 *   adapter,
 *   plugins: [createSsePlugin()],
 * });
 */
const EMPTY_SSE_OPTIONS: SsePluginOptions = {};
export function createSsePlugin(
  _options: SsePluginOptions = EMPTY_SSE_OPTIONS
): ConversationPlugin {
  return {
    name: "sse",
    version: "1.0.0",
    routes: [
      {
        method: "GET",
        path: "/conversations/:id/stream",
        handler: handleConversationsStream,
      },
    ],
  };
}

export { handleConversationsStream } from "./streamHandler.js";
