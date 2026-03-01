import type {
  Block,
  Conversation,
  Paginated,
  Participant,
  ResolvedPolicy,
} from "@better-conversation/core";
import { useCallback, useEffect, useState } from "react";
import {
  type ConversationClient,
  type ConversationClientOptions,
  createConversationClient,
} from "./index.js";

export type { ConversationClient, ConversationClientOptions };

export function useConversation(options: ConversationClientOptions, conversationId: string | null) {
  const [client] = useState(() => createConversationClient(options));
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const c = await client.conversations.find(conversationId);
      setConversation(c);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setConversation(null);
    } finally {
      setLoading(false);
    }
  }, [client, conversationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conversation, loading, error, refresh };
}

export function useBlocks(
  options: ConversationClientOptions,
  conversationId: string | null,
  params?: { limit?: number; threadParentId?: string }
) {
  const [client] = useState(() => createConversationClient(options));
  const [blocks, setBlocks] = useState<Paginated<Block>>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setBlocks({ items: [], total: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await client.blocks.list(conversationId, {
        limit: params?.limit ?? 50,
        threadParentId: params?.threadParentId,
      });
      setBlocks(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setBlocks({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [client, conversationId, params?.limit, params?.threadParentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { blocks, loading, error, refresh };
}

export function useParticipants(options: ConversationClientOptions, conversationId: string | null) {
  const [client] = useState(() => createConversationClient(options));
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setParticipants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await client.participants.list(conversationId);
      setParticipants(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [client, conversationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { participants, loading, error, refresh };
}

export function usePolicy(
  options: ConversationClientOptions,
  chatterId: string | null,
  conversationId?: string | null,
  threadParentBlockId?: string | null
) {
  const [client] = useState(() => createConversationClient(options));
  const [policy, setPolicy] = useState<ResolvedPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!chatterId) {
      setPolicy(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const p = await client.policies.resolve(
        chatterId,
        conversationId ?? undefined,
        threadParentBlockId ?? undefined
      );
      setPolicy(p);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, [client, chatterId, conversationId, threadParentBlockId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { policy, loading, error, refresh };
}

export function useInfiniteBlocks(
  options: ConversationClientOptions,
  conversationId: string | null,
  params?: { pageSize?: number; threadParentId?: string }
) {
  const [client] = useState(() => createConversationClient(options));
  const [items, setItems] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [beforeCursor, setBeforeCursor] = useState<string | undefined>();

  const pageSize = params?.pageSize ?? 50;

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore || !beforeCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await client.blocks.list(conversationId, {
        limit: pageSize,
        before: beforeCursor,
        threadParentId: params?.threadParentId,
      });
      setItems((prev) => [...prev, ...result.items]);
      const last = result.items[result.items.length - 1];
      setBeforeCursor(last?.createdAt ? new Date(last.createdAt).toISOString() : undefined);
      setHasMore(result.hasMore ?? false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoadingMore(false);
    }
  }, [
    client,
    conversationId,
    beforeCursor,
    hasMore,
    loadingMore,
    pageSize,
    params?.threadParentId,
  ]);

  useEffect(() => {
    if (!conversationId) {
      setItems([]);
      setLoading(false);
      setHasMore(false);
      setBeforeCursor(undefined);
      return;
    }
    setLoading(true);
    setError(null);
    setHasMore(true);
    setBeforeCursor(undefined);
    client.blocks
      .list(conversationId, {
        limit: pageSize,
        threadParentId: params?.threadParentId,
      })
      .then((result) => {
        setItems(result.items);
        const last = result.items[result.items.length - 1];
        setBeforeCursor(last?.createdAt ? new Date(last.createdAt).toISOString() : undefined);
        setHasMore(result.hasMore ?? false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [client, conversationId, pageSize, params?.threadParentId]);

  return { items, loading, loadingMore, error, hasMore, loadMore };
}
