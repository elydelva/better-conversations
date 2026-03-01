import type { ConversationClientPlugin } from "@better-conversation/client";

/**
 * SSE client plugin — adds stream(conversationId) for Server-Sent Events.
 * Use with createBetterConversationsClient: plugins: [sseClient()]
 */
export function sseClient(): ConversationClientPlugin {
  return (ctx) => ({
    endpoints: {
      stream: (conversationId: string): EventSource =>
        new EventSource(`${ctx.baseURL}/conversations/${conversationId}/stream`),
    },
  });
}
