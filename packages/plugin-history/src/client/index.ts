import type { ConversationClientPlugin } from "@better-conversation/client";
import type { BlockHistoryEntry } from "../types.js";

/**
 * History client plugin — adds blocks.history(conversationId, blockId) for block edit history.
 * Use with createBetterConversationsClient: plugins: [historyClient()]
 */
export function historyClient(): ConversationClientPlugin {
  return (ctx) => ({
    extend: {
      blocks: {
        history: async (conversationId: string, blockId: string): Promise<BlockHistoryEntry[]> => {
          const url = `${ctx.baseURL}/conversations/${conversationId}/blocks/${blockId}/history`;
          const res = await ctx.fetch(url);
          if (!res.ok) {
            const text = await res.text();
            let message = res.statusText;
            try {
              const json = JSON.parse(text);
              message = json.message ?? json.error ?? message;
            } catch {
              if (text) message = text;
            }
            throw new Error(message);
          }
          return res.json();
        },
      },
    },
  });
}

export type { BlockHistoryEntry } from "../types.js";
