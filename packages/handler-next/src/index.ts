import {
  type ConversationEngine,
  type CoreRequest,
  dispatch,
  parseJsonBody,
} from "@better-conversation/core";
import type { NextRequest } from "next/server";

export interface CreateNextHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use getServerSession, JWT, etc. */
  getCurrentChatter?: (req: NextRequest) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

async function toCoreRequest(
  req: NextRequest,
  options?: CreateNextHandlerOptions
): Promise<CoreRequest> {
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

  const coreReq: CoreRequest = {
    method: req.method,
    path,
    params: {},
    query,
    body,
  };

  if (options?.getCurrentChatter) {
    const chatterId = await Promise.resolve(options.getCurrentChatter(req));
    if (chatterId) {
      coreReq.auth = { chatterId };
    }
  }

  return coreReq;
}

function toNextResponse(
  status: number,
  body?: unknown,
  options?: { stream?: ReadableStream; headers?: Record<string, string> }
): Response {
  if (options?.stream) {
    return new Response(options.stream, {
      status,
      headers: options.headers,
    });
  }
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
  const coreReq = await toCoreRequest(req, options);
  if (options?.requireAuth && options?.getCurrentChatter && !coreReq.auth) {
    return new Response(null, { status: 401 });
  }
  const coreRes = await dispatch(engine, coreReq, basePath);
  return toNextResponse(coreRes.status, coreRes.body, {
    stream: coreRes.stream,
    headers: coreRes.headers,
  });
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
