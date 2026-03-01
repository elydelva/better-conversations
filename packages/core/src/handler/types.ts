import type { ConversationEngine } from "../engine.js";

export interface RequestAuth {
  chatterId: string;
}

export interface CoreRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  /** Populated by handler adapters via getCurrentChatter; used for authorization */
  auth?: RequestAuth;
}

export interface CoreResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  stream?: ReadableStream;
}

export type RouteHandler = (ctx: {
  engine: ConversationEngine;
  req: CoreRequest;
}) => Promise<CoreResponse>;
