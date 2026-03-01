const BASE = "/api/conversation";
const PLAYGROUND = "/api/playground";

async function fetchApi<T>(path: string, init?: RequestInit & { method?: string }): Promise<T> {
  const url = path.startsWith("/api/") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText;
    try {
      const json = JSON.parse(text);
      message = json.message ?? json.error ?? json.code ?? message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function convPath(path: string) {
  return path.startsWith("/api/") ? path : `${BASE}${path}`;
}

export interface Chatter {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  status: string;
  entityType: string | null;
  entityId: string | null;
  createdBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  conversationId: string;
  chatterId: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
  lastReadAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface Block {
  id: string;
  conversationId: string;
  authorId: string;
  type: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  threadParentId: string | null;
  status: string;
  refusalReason: string | null;
  flaggedAt: string | null;
  editedAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor?: string;
}

// Playground-specific: list chatters (no core API for this)
export const playgroundApi = {
  listChatters: () => fetchApi<{ items: Chatter[] }>(`${PLAYGROUND}/chatters`).then((r) => r.items),
};

// Chatters
export const chattersApi = {
  create: (data: {
    displayName: string;
    entityType: string;
    entityId?: string;
    avatarUrl?: string;
  }) => fetchApi<Chatter>(convPath("/chatters"), { method: "POST", body: JSON.stringify(data) }),

  find: (id: string) => fetchApi<Chatter>(convPath(`/chatters/${id}`)),

  update: (
    id: string,
    data: Partial<{ displayName: string; avatarUrl: string; entityType: string; entityId: string }>
  ) =>
    fetchApi<Chatter>(convPath(`/chatters/${id}`), {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  listConversations: (chatterId: string, limit = 50, cursor?: string) =>
    fetchApi<Paginated<Conversation>>(
      convPath(
        `/chatters/${chatterId}/conversations?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`
      )
    ),
};

// Conversations
export const conversationsApi = {
  create: (data: {
    title?: string;
    status?: string;
    entityType?: string;
    entityId?: string;
    createdBy: string;
    metadata?: Record<string, unknown>;
    participants?: Array<{ chatterId: string; role: string }>;
  }) =>
    fetchApi<Conversation>(convPath("/conversations"), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  find: (id: string) => fetchApi<Conversation>(convPath(`/conversations/${id}`)),

  list: (params?: {
    entityType?: string;
    entityId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.entityType) q.set("entityType", params.entityType);
    if (params?.entityId) q.set("entityId", params.entityId);
    if (params?.status) q.set("status", params.status);
    q.set("limit", String(params?.limit ?? 50));
    if (params?.cursor) q.set("cursor", params.cursor);
    return fetchApi<Paginated<Conversation>>(convPath(`/conversations?${q}`));
  },

  findByEntity: (entityType: string, entityId: string) =>
    fetchApi<Conversation[]>(
      convPath(`/conversations?entityType=${entityType}&entityId=${entityId}`)
    ),

  update: (
    id: string,
    data: Partial<{ title: string; status: string; entityType: string; entityId: string }>
  ) =>
    fetchApi<Conversation>(convPath(`/conversations/${id}`), {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  archive: (id: string) => fetchApi<void>(convPath(`/conversations/${id}`), { method: "DELETE" }),
};

// Participants
export const participantsApi = {
  list: (conversationId: string) =>
    fetchApi<Participant[]>(convPath(`/conversations/${conversationId}/participants`)),

  add: (conversationId: string, data: { chatterId: string; role: string }) =>
    fetchApi<Participant>(convPath(`/conversations/${conversationId}/participants`), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  setRole: (conversationId: string, chatterId: string, role: string) =>
    fetchApi<void>(convPath(`/conversations/${conversationId}/participants/${chatterId}`), {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  remove: (conversationId: string, chatterId: string) =>
    fetchApi<void>(convPath(`/conversations/${conversationId}/participants/${chatterId}`), {
      method: "DELETE",
    }),

  markRead: (conversationId: string, chatterId: string) =>
    fetchApi<void>(convPath(`/conversations/${conversationId}/participants/${chatterId}/read`), {
      method: "PATCH",
    }),
};

// Blocks
export const blocksApi = {
  list: (
    conversationId: string,
    params?: { limit?: number; before?: string; after?: string; threadParentId?: string }
  ) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.before) q.set("before", params.before);
    if (params?.after) q.set("after", params.after);
    if (params?.threadParentId) q.set("threadParentId", params.threadParentId);
    return fetchApi<Paginated<Block>>(convPath(`/conversations/${conversationId}/blocks?${q}`));
  },

  send: (
    conversationId: string,
    data: {
      authorId: string;
      type: string;
      body?: string;
      metadata?: Record<string, unknown>;
      threadParentId?: string;
    }
  ) =>
    fetchApi<Block>(convPath(`/conversations/${conversationId}/blocks`), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    conversationId: string,
    blockId: string,
    data: { body?: string; metadata?: Record<string, unknown> }
  ) =>
    fetchApi<Block>(convPath(`/conversations/${conversationId}/blocks/${blockId}`), {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (conversationId: string, blockId: string) =>
    fetchApi<void>(convPath(`/conversations/${conversationId}/blocks/${blockId}`), {
      method: "DELETE",
    }),
};

// Policies
export const policiesApi = {
  resolve: (chatterId: string, conversationId?: string, threadParentBlockId?: string) => {
    const q = new URLSearchParams();
    if (conversationId) q.set("conversationId", conversationId);
    if (threadParentBlockId) q.set("threadParentBlockId", threadParentBlockId);
    return fetchApi<Record<string, unknown>>(
      convPath(`/policies/chatters/${chatterId}${q.toString() ? `?${q}` : ""}`)
    );
  },

  getGlobal: () => fetchApi<Record<string, unknown>>(convPath("/policies/global")),

  setGlobal: (policy: Record<string, unknown>) =>
    fetchApi<void>(convPath("/policies/global"), {
      method: "PATCH",
      body: JSON.stringify(policy),
    }),

  listRoles: () => fetchApi<{ roles: string[] }>(convPath("/policies/roles")),

  setRole: (role: string, policy: Record<string, unknown>) =>
    fetchApi<void>(convPath(`/policies/roles/${role}`), {
      method: "PATCH",
      body: JSON.stringify(policy),
    }),

  setChatter: (chatterId: string, policy: Record<string, unknown>) =>
    fetchApi<void>(convPath(`/policies/chatters/${chatterId}`), {
      method: "PATCH",
      body: JSON.stringify(policy),
    }),

  setConversation: (conversationId: string, policy: Record<string, unknown>) =>
    fetchApi<void>(convPath(`/policies/conversations/${conversationId}`), {
      method: "PATCH",
      body: JSON.stringify(policy),
    }),

  setThread: (conversationId: string, blockId: string, policy: Record<string, unknown>) =>
    fetchApi<void>(convPath(`/policies/conversations/${conversationId}/threads/${blockId}`), {
      method: "PATCH",
      body: JSON.stringify(policy),
    }),
};

// Permissions
export const permissionsApi = {
  list: (chatterId: string) =>
    fetchApi<Array<{ action: string; scope: string | null; granted: boolean }>>(
      convPath(`/chatters/${chatterId}/permissions`)
    ),

  grant: (chatterId: string, data: { action: string; scope?: string }) =>
    fetchApi<void>(convPath(`/chatters/${chatterId}/permissions`), {
      method: "POST",
      body: JSON.stringify(data),
    }),

  revoke: (chatterId: string, action: string) =>
    fetchApi<void>(convPath(`/chatters/${chatterId}/permissions/${encodeURIComponent(action)}`), {
      method: "DELETE",
    }),
};
