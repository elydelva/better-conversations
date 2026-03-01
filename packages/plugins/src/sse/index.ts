import type { ConversationPlugin } from "@better-conversation/core";

/**
 * SSE plugin — enables Server-Sent Events for real-time block updates.
 * When added to config.plugins, documents that SSE is used.
 *
 * The SSE endpoint GET /conversations/:id/stream is built into the core handler.
 * It streams block:created events (polling-based, Edge-compatible).
 */
export const ssePlugin: ConversationPlugin = {
  name: "sse",
  init() {
    // No setup required — SSE route is handled by core dispatch
  },
};
