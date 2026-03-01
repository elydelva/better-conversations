import type {
  Block,
  Chatter,
  Conversation,
  Paginated,
  Participant,
  ResolvedPolicy,
} from "@better-conversation/core";

export const version = "0.0.0";

export interface ConversationClientOptions {
  baseUrl: string;
  chatterId?: string;
  fetchFn?: typeof globalThis.fetch;
}

async function request<T>(
  baseUrl: string,
  method: string,
  path: string,
  options: { body?: unknown; fetchFn?: typeof fetch } = {}
): Promise<T> {
  const { body, fetchFn = fetch } = options;
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const init: RequestInit = {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  const res = await fetchFn(url, init);
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok)
    throw new Error((json as { message?: string })?.message ?? `Request failed: ${res.status}`);
  return json as T;
}

export function createConversationClient<_TEngine = unknown>(options: ConversationClientOptions) {
  const { baseUrl, fetchFn = globalThis.fetch } = options;
  const req = <T>(method: string, path: string, body?: unknown) =>
    request<T>(baseUrl, method, path, { body, fetchFn });

  return {
    chatters: {
      find: (id: string) => req<Chatter>("GET", `/chatters/${id}`),
      create: (data: {
        displayName: string;
        entityType: string;
        entityId?: string | null;
        avatarUrl?: string | null;
      }) => req<Chatter>("POST", "/chatters", data),
      update: (
        id: string,
        data: Partial<{
          displayName: string;
          avatarUrl: string;
          entityType: string;
          entityId: string;
        }>
      ) => req<Chatter>("PATCH", `/chatters/${id}`, data),
    },
    conversations: {
      find: (id: string) => req<Conversation>("GET", `/conversations/${id}`),
      list: (params?: {
        entityType?: string;
        entityId?: string;
        limit?: number;
        cursor?: string;
      }) => {
        const q = new URLSearchParams();
        if (params?.entityType) q.set("entityType", params.entityType);
        if (params?.entityId) q.set("entityId", params.entityId);
        if (params?.limit) q.set("limit", String(params.limit));
        if (params?.cursor) q.set("cursor", params.cursor);
        const suffix = q.toString() ? `?${q}` : "";
        return req<Paginated<Conversation>>("GET", `/conversations${suffix}`);
      },
      create: (data: {
        createdBy: string;
        participants: { chatterId: string; role: string }[];
        title?: string | null;
        entityType?: string | null;
        entityId?: string | null;
      }) => req<Conversation>("POST", "/conversations", data),
      update: (
        id: string,
        data: Partial<{ title: string; status: string; metadata: Record<string, unknown> }>
      ) => req<Conversation>("PATCH", `/conversations/${id}`, data),
    },
    participants: {
      list: (conversationId: string) =>
        req<Participant[]>("GET", `/conversations/${conversationId}/participants`),
      add: (conversationId: string, data: { chatterId: string; role: string }) =>
        req<Participant>("POST", `/conversations/${conversationId}/participants`, data),
      remove: (conversationId: string, chatterId: string) =>
        req<void>("DELETE", `/conversations/${conversationId}/participants/${chatterId}`),
      markRead: (conversationId: string, chatterId: string) =>
        req<Participant>(
          "PATCH",
          `/conversations/${conversationId}/participants/${chatterId}/read`,
          {}
        ),
      setRole: (conversationId: string, chatterId: string, role: string) =>
        req<Participant>("PATCH", `/conversations/${conversationId}/participants/${chatterId}`, {
          role,
        }),
    },
    blocks: {
      list: (
        conversationId: string,
        params?: { limit?: number; before?: string; after?: string; threadParentId?: string }
      ) => {
        const q = new URLSearchParams();
        if (params?.limit) q.set("limit", String(params.limit));
        if (params?.before) q.set("before", params.before);
        if (params?.after) q.set("after", params.after);
        if (params?.threadParentId != null) q.set("threadParentId", params.threadParentId);
        const suffix = q.toString() ? `?${q}` : "";
        return req<Paginated<Block>>("GET", `/conversations/${conversationId}/blocks${suffix}`);
      },
      send: (
        conversationId: string,
        data: {
          authorId: string;
          type: string;
          body?: string | null;
          metadata?: Record<string, unknown> | null;
          threadParentId?: string | null;
        }
      ) => req<Block>("POST", `/conversations/${conversationId}/blocks`, data),
      updateMeta: (
        conversationId: string,
        blockId: string,
        data: Partial<{ body: string; metadata: Record<string, unknown> }>
      ) => req<Block>("PATCH", `/conversations/${conversationId}/blocks/${blockId}`, data),
      delete: (conversationId: string, blockId: string) =>
        req<void>("DELETE", `/conversations/${conversationId}/blocks/${blockId}`),
    },
    policies: {
      resolve: (chatterId: string, conversationId?: string, threadParentBlockId?: string) => {
        const q = new URLSearchParams();
        if (conversationId) q.set("conversationId", conversationId);
        if (threadParentBlockId) q.set("threadParentBlockId", threadParentBlockId);
        const suffix = q.toString() ? `?${q}` : "";
        return req<ResolvedPolicy>("GET", `/policies/chatters/${chatterId}${suffix}`);
      },
    },
    stream: (conversationId: string): EventSource => {
      const url = `${baseUrl.replace(/\/$/, "")}/conversations/${conversationId}/stream`;
      return new EventSource(url);
    },
  };
}

export type ConversationClient = ReturnType<typeof createConversationClient>;
