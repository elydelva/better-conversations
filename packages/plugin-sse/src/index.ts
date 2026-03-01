import type { ConversationPlugin } from "@better-conversation/core";
import { handleConversationsStream } from "./streamHandler.js";

/**
 * SSE plugin — enables Server-Sent Events for real-time block updates.
 * Registers GET /conversations/:id/stream (polling-based, Edge-compatible).
 */
export const ssePlugin: ConversationPlugin = {
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

export { handleConversationsStream } from "./streamHandler.js";
