import { createBetterConversationsClient } from "@better-conversation/client";
import { historyClient } from "@better-conversation/plugin-history/client";
import { sseClient } from "@better-conversation/plugin-sse/client";
import { getAuthChatterId } from "./auth-header";

export const convClient = createBetterConversationsClient({
  baseURL: "/api/conversation",
  getHeaders: () => {
    const id = getAuthChatterId();
    return id ? { "X-Chatter-Id": id } : {};
  },
  plugins: [sseClient(), historyClient()],
});
