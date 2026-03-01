"use client";

import {
  QueryClient,
  QueryClientProvider,
  type QueryClient as QueryClientType,
} from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import type { ConversationClient } from "./types.js";

const ConversationClientContext = createContext<ConversationClient | null>(null);

export interface ConversationProviderProps {
  client: ConversationClient;
  queryClient?: QueryClientType;
  children: React.ReactNode;
}

/** Default TanStack Query client with sensible defaults for conversation data */
const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

export function ConversationProvider({ client, queryClient, children }: ConversationProviderProps) {
  const qc = useMemo(() => queryClient ?? defaultQueryClient, [queryClient]);

  return (
    <QueryClientProvider client={qc}>
      <ConversationClientContext.Provider value={client}>
        {children}
      </ConversationClientContext.Provider>
    </QueryClientProvider>
  );
}

export function useConversationClient(): ConversationClient {
  const client = useContext(ConversationClientContext);
  if (!client) {
    throw new Error("useConversationClient must be used within a ConversationProvider");
  }
  return client;
}
