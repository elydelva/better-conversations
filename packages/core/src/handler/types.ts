import type { ConversationEngine } from "../engine.js";

export interface CoreRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
}

export interface CoreResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export type RouteHandler = (ctx: {
  engine: ConversationEngine;
  req: CoreRequest;
}) => Promise<CoreResponse>;
