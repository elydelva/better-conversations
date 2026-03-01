"use client";

import { convClient } from "@/lib/conversation-client";
import { ConversationProvider } from "@better-conversation/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConversationProvider client={convClient}>{children}</ConversationProvider>;
}
