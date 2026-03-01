export interface ClientPluginContext {
  baseURL: string;
  fetch: typeof globalThis.fetch;
  options: ClientOptions;
}

export interface ClientOptions {
  baseURL: string;
  fetchFn?: typeof globalThis.fetch;
  fetchOptions?: RequestInit;
  plugins?: ConversationClientPlugin[];
}

export interface ClientPluginResult {
  /** Schema extension for createFetch (optional) */
  schemaExtension?: Record<string, unknown>;
  /** Additional methods to merge into the client, e.g. { stream: (id) => EventSource } */
  endpoints?: Record<string, unknown>;
  /** Extend blocks, chatters, etc. e.g. { blocks: { history: (convId, blockId) => Promise<...> } } */
  extend?: Record<string, Record<string, unknown>>;
}

export type ConversationClientPlugin = (
  ctx: ClientPluginContext
) => ClientPluginResult | Promise<ClientPluginResult>;
