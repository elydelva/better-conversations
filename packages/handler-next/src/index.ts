import {
  type ConversationEngine,
  type CoreRequest,
  dispatch,
  parseJsonBody,
} from "@better-conversation/core";
import type { NextRequest } from "next/server";

export interface CreateNextHandlerOptions {
  basePath?: string;
}

async function toCoreRequest(req: NextRequest): Promise<CoreRequest> {
  const url = req.nextUrl ?? new URL(req.url);
  const path = url.pathname;
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  let body: unknown = null;
  if (req.method === "POST" || req.method === "PATCH") {
    body = parseJsonBody(await req.text());
  }

  return {
    method: req.method,
    path,
    params: {},
    query,
    body,
  };
}

function toNextResponse(status: number, body?: unknown): Response {
  if (status === 204) {
    return new Response(null, { status: 204 });
  }
  return Response.json(body ?? null, { status });
}

async function handle(
  engine: ConversationEngine,
  req: NextRequest,
  options: CreateNextHandlerOptions
): Promise<Response> {
  const basePath = options.basePath ?? "";
  const coreReq = await toCoreRequest(req);
  const coreRes = await dispatch(engine, coreReq, basePath);
  return toNextResponse(coreRes.status, coreRes.body);
}

export function createNextHandler(engine: ConversationEngine, options?: CreateNextHandlerOptions) {
  const opts = options ?? {};

  return {
    GET: (req: NextRequest, _context?: { params?: Promise<{ slug?: string[] }> }) =>
      handle(engine, req, opts),
    POST: (req: NextRequest) => handle(engine, req, opts),
    PATCH: (req: NextRequest) => handle(engine, req, opts),
    DELETE: (req: NextRequest) => handle(engine, req, opts),
  };
}
