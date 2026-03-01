import { createBetterConversationsClient } from "@better-conversation/client";
import { historyClient } from "@better-conversation/plugin-history/client";
import { sseClient } from "@better-conversation/plugin-sse/client";

export const convClient = createBetterConversationsClient({
  baseURL: "/api/conversation",
  plugins: [sseClient(), historyClient()],
});
