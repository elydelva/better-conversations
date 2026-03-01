import { useQuery } from "@tanstack/react-query";
import { useConversationClient } from "../context.js";
import { queryKeys } from "../query-keys.js";

export function useChatters(params?: { limit?: number; cursor?: string }) {
  const client = useConversationClient();
  return useQuery({
    queryKey: queryKeys.chatters.list(params),
    queryFn: () => client.chatters.list(params),
  });
}

export function useChatterConversations(
  chatterId: string | null,
  params?: { limit?: number; cursor?: string }
) {
  const client = useConversationClient();
  return useQuery({
    queryKey: queryKeys.chatters.conversations(chatterId ?? "", params),
    queryFn: () =>
      chatterId
        ? client.chatters.listConversations(chatterId, params?.limit, params?.cursor)
        : Promise.reject(new Error("No chatter ID")),
    enabled: !!chatterId,
  });
}

export function useConversations(params?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
  cursor?: string;
}) {
  const client = useConversationClient();
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () => client.conversations.list(params),
  });
}

export function useConversation(conversationId: string | null) {
  const client = useConversationClient();
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId ?? ""),
    queryFn: () =>
      conversationId
        ? client.conversations.find(conversationId)
        : Promise.reject(new Error("No conversation ID")),
    enabled: !!conversationId,
  });
}

export function useBlocks(
  conversationId: string | null,
  params?: { limit?: number; before?: string; after?: string; threadParentId?: string }
) {
  const client = useConversationClient();
  return useQuery({
    queryKey: queryKeys.conversations.blocks(conversationId ?? "", params),
    queryFn: () =>
      conversationId
        ? client.blocks.list(conversationId, params)
        : Promise.resolve({ items: [], total: 0, hasMore: false }),
    enabled: !!conversationId,
  });
}

export function useParticipants(conversationId: string | null) {
  const client = useConversationClient();
  return useQuery({
    queryKey: queryKeys.conversations.participants(conversationId ?? ""),
    queryFn: () =>
      conversationId ? client.participants.list(conversationId) : Promise.resolve([]),
    enabled: !!conversationId,
  });
}

export function usePolicy(
  chatterId: string | null,
  conversationId?: string | null,
  threadParentBlockId?: string | null
) {
  const client = useConversationClient();
  return useQuery({
    queryKey: queryKeys.policies.resolve(
      chatterId ?? "",
      conversationId ?? undefined,
      threadParentBlockId ?? undefined
    ),
    queryFn: () =>
      chatterId
        ? client.policies.resolve(
            chatterId,
            conversationId ?? undefined,
            threadParentBlockId ?? undefined
          )
        : Promise.reject(new Error("No chatter ID")),
    enabled: !!chatterId,
  });
}
