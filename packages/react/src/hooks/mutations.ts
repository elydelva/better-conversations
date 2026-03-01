import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConversationClient } from "../context.js";
import { queryKeys } from "../query-keys.js";

export function useCreateChatter() {
  const client = useConversationClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      displayName: string;
      entityType: string;
      entityId?: string | null;
      avatarUrl?: string | null;
    }) => client.chatters.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatters.all });
    },
  });
}

export function useCreateConversation() {
  const client = useConversationClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      createdBy: string;
      participants: { chatterId: string; role: string }[];
      title?: string | null;
      entityType?: string | null;
      entityId?: string | null;
    }) => client.conversations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useSendBlock(conversationId: string) {
  const client = useConversationClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      authorId: string;
      type: string;
      body?: string | null;
      metadata?: Record<string, unknown> | null;
      threadParentId?: string | null;
    }) => client.blocks.send(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.blocks(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(conversationId),
      });
    },
  });
}

export function useUpdateBlock(conversationId: string, blockId: string) {
  const client = useConversationClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{ body: string; metadata: Record<string, unknown> }>) =>
      client.blocks.update(conversationId, blockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.blocks(conversationId),
      });
    },
  });
}

export function useDeleteBlock(conversationId: string, blockId: string) {
  const client = useConversationClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.blocks.delete(conversationId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.blocks(conversationId),
      });
    },
  });
}

export function useAddParticipant(conversationId: string) {
  const client = useConversationClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { chatterId: string; role: string }) =>
      client.participants.add(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.participants(conversationId),
      });
    },
  });
}

export function useRemoveParticipant(conversationId: string) {
  const client = useConversationClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatterId: string) => client.participants.remove(conversationId, chatterId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.participants(conversationId),
      });
    },
  });
}
