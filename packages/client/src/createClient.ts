import type {
  Block,
  Chatter,
  Conversation,
  Paginated,
  Participant,
  ResolvedPolicy,
} from "@better-conversation/core";
import { createFetch } from "@better-fetch/fetch";
import type { ClientOptions, ConversationClientPlugin } from "./plugins/types.js";

function runPluginsSync(
  plugins: ConversationClientPlugin[],
  ctx: { baseURL: string; fetch: typeof globalThis.fetch; options: ClientOptions }
) {
  const results = plugins.map((p) => {
    const r = p(ctx);
    return r instanceof Promise ? ({} as Awaited<ReturnType<ConversationClientPlugin>>) : r;
  });
  const empty = {
    endpoints: {} as Record<string, unknown>,
    extend: {} as Record<string, Record<string, unknown>>,
  };
  return results.reduce((acc, r) => {
    const nextEndpoints = { ...acc.endpoints, ...r.endpoints };
    const ext = r.extend ?? {};
    const nextExtend = (Object.keys(ext) as (keyof typeof acc.extend)[]).reduce(
      (e, k) => Object.assign({}, e, { [k]: { ...(e[k] ?? {}), ...ext[k] } }),
      acc.extend ?? {}
    );
    return { endpoints: nextEndpoints, extend: nextExtend };
  }, empty);
}

export function createBetterConversationsClient(options: ClientOptions) {
  const {
    baseURL,
    fetchFn = globalThis.fetch,
    fetchOptions,
    getHeaders,
    plugins: pluginsOption = [],
  } = options;

  const base = baseURL.replace(/\/$/, "");
  const ctx = {
    baseURL: base,
    fetch: fetchFn,
    options,
  };

  const $fetch = createFetch({
    baseURL: base,
    throw: true,
    fetch: fetchFn,
    ...fetchOptions,
  });

  const req = async <T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>
  ): Promise<T> => {
    const url = path.startsWith("/") ? path : `/${path}`;
    const opts: Record<string, unknown> = { method };
    if (body !== undefined) opts.body = body;
    if (query && Object.keys(query).length > 0) {
      opts.query = Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== "")
      );
    }
    if (getHeaders) {
      const headers = await Promise.resolve(getHeaders());
      opts.headers = { ...(fetchOptions?.headers as Record<string, string>), ...headers };
    }
    const res = await $fetch(url, opts);
    return res as T;
  };

  const reqWithQuery = <T>(
    method: string,
    path: string,
    query?: Record<string, string | number | undefined>
  ) => req<T>(method, path, undefined, query);

  const chatters = {
    list: (params?: { limit?: number; cursor?: string }) =>
      reqWithQuery<Paginated<Chatter>>("GET", "/chatters", {
        limit: params?.limit,
        cursor: params?.cursor,
      }),
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
  };

  const conversations = {
    find: (id: string) => req<Conversation>("GET", `/conversations/${id}`),
    list: (params?: {
      entityType?: string;
      entityId?: string;
      limit?: number;
      cursor?: string;
    }) =>
      reqWithQuery<Paginated<Conversation>>("GET", "/conversations", {
        entityType: params?.entityType,
        entityId: params?.entityId,
        limit: params?.limit,
        cursor: params?.cursor,
      }),
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
    archive: (id: string) => req<void>("DELETE", `/conversations/${id}`),
  };

  const participants = {
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
  };

  const blocks = {
    list: (
      conversationId: string,
      params?: { limit?: number; before?: string; after?: string; threadParentId?: string }
    ) => {
      const q: Record<string, string | number | undefined> = {};
      if (params?.limit != null) q.limit = params.limit;
      if (params?.before) q.before = params.before;
      if (params?.after) q.after = params.after;
      if (params?.threadParentId != null) q.threadParentId = params.threadParentId;
      return reqWithQuery<Paginated<Block>>("GET", `/conversations/${conversationId}/blocks`, q);
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
    update: (
      conversationId: string,
      blockId: string,
      data: Partial<{ body: string; metadata: Record<string, unknown> }>
    ) => req<Block>("PATCH", `/conversations/${conversationId}/blocks/${blockId}`, data),
    delete: (conversationId: string, blockId: string) =>
      req<void>("DELETE", `/conversations/${conversationId}/blocks/${blockId}`),
  };

  const policies = {
    resolve: (chatterId: string, conversationId?: string, threadParentBlockId?: string) => {
      const q: Record<string, string | undefined> = {};
      if (conversationId) q.conversationId = conversationId;
      if (threadParentBlockId) q.threadParentBlockId = threadParentBlockId;
      return reqWithQuery<ResolvedPolicy>("GET", `/policies/chatters/${chatterId}`, q);
    },
    getGlobal: () => req<ResolvedPolicy>("GET", "/policies/global"),
    setGlobal: (policy: Record<string, unknown>) => req<void>("PATCH", "/policies/global", policy),
    listRoles: () => req<{ roles: string[] }>("GET", "/policies/roles"),
    setRole: (role: string, policy: Record<string, unknown>) =>
      req<void>("PATCH", `/policies/roles/${role}`, policy),
    setChatter: (chatterId: string, policy: Record<string, unknown>) =>
      req<void>("PATCH", `/policies/chatters/${chatterId}`, policy),
    setConversation: (conversationId: string, policy: Record<string, unknown>) =>
      req<void>("PATCH", `/policies/conversations/${conversationId}`, policy),
    setThread: (conversationId: string, blockId: string, policy: Record<string, unknown>) =>
      req<void>("PATCH", `/policies/conversations/${conversationId}/threads/${blockId}`, policy),
  };

  const permissions = {
    list: (chatterId: string) =>
      req<Array<{ action: string; scope: string | null; granted: boolean }>>(
        "GET",
        `/chatters/${chatterId}/permissions`
      ),
    grant: (chatterId: string, data: { action: string; scope?: string }) =>
      req<void>("POST", `/chatters/${chatterId}/permissions`, data),
    revoke: (chatterId: string, action: string) =>
      req<void>("DELETE", `/chatters/${chatterId}/permissions/${encodeURIComponent(action)}`),
  };

  const chattersWithList = {
    ...chatters,
    listConversations: (chatterId: string, limit = 50, cursor?: string) =>
      reqWithQuery<Paginated<Conversation>>("GET", `/chatters/${chatterId}/conversations`, {
        limit,
        cursor,
      }),
  };

  let client = {
    chatters: chattersWithList,
    conversations,
    participants,
    blocks,
    policies,
    permissions,
  };

  if (pluginsOption.length > 0) {
    const { endpoints, extend } = runPluginsSync(pluginsOption, ctx);
    const ext = extend ?? {};
    if (Object.keys(ext).length > 0) {
      client = {
        ...client,
        ...Object.fromEntries(
          Object.entries(ext).map(([k, v]) => {
            const existing = (client as Record<string, unknown>)[k] as
              | Record<string, unknown>
              | undefined;
            const merged =
              typeof existing === "object" &&
              existing !== null &&
              typeof v === "object" &&
              v !== null
                ? { ...existing, ...v }
                : v;
            return [k, merged];
          })
        ),
      } as typeof client;
    }
    const ep = endpoints ?? {};
    if (Object.keys(ep).length > 0) {
      client = { ...client, ...ep } as typeof client;
    }
  }

  return client;
}

export type BetterConversationsClient = ReturnType<typeof createBetterConversationsClient>;
