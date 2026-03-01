import {
  type ConversationEngine,
  type CoreRequest,
  dispatch,
  parseJsonBody,
} from "@better-conversation/core";
import type { Context } from "hono";

export interface CreateHonoHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use session, JWT, etc. */
  getCurrentChatter?: (c: Context) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

function queryToRecord(q: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q ?? {})) {
    if (v !== undefined) {
      out[k] = Array.isArray(v) ? v[0] : String(v);
    }
  }
  return out;
}

async function toCoreRequest(c: Context, options?: CreateHonoHandlerOptions): Promise<CoreRequest> {
  const path = c.req.path;
  const query = queryToRecord(c.req.query() as Record<string, string | string[] | undefined>);

  let body: unknown = null;
  if (c.req.method === "POST" || c.req.method === "PATCH") {
    const raw = await c.req.text();
    body = parseJsonBody(raw || null);
  }

  const coreReq: CoreRequest = {
    method: c.req.method,
    path,
    params: {},
    query,
    body,
  };

  if (options?.getCurrentChatter) {
    const chatterId = await Promise.resolve(options.getCurrentChatter(c));
    if (chatterId) {
      coreReq.auth = { chatterId };
    }
  }

  return coreReq;
}

export function createHonoHandler(engine: ConversationEngine, options?: CreateHonoHandlerOptions) {
  const basePath = options?.basePath ?? "";

  return async (c: Context) => {
    const coreReq = await toCoreRequest(c, options);
    if (options?.requireAuth && options?.getCurrentChatter && !coreReq.auth) {
      return c.body(null, 401);
    }
    const coreRes = await dispatch(engine, coreReq, basePath);

    if (coreRes.stream) {
      return new Response(coreRes.stream, {
        status: coreRes.status,
        headers: coreRes.headers,
      });
    }
    if (coreRes.status === 204) {
      return c.body(null, 204);
    }
    return c.json(coreRes.body ?? null, coreRes.status as 200 | 201 | 400 | 401 | 403 | 404 | 500);
  };
}
