import {
  type ConversationEngine,
  type CoreRequest,
  dispatch,
  parseJsonBody,
} from "@better-conversation/core";
import type { Context } from "hono";

export interface CreateHonoHandlerOptions {
  basePath?: string;
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

async function toCoreRequest(c: Context): Promise<CoreRequest> {
  const path = c.req.path;
  const query = queryToRecord(c.req.query() as Record<string, string | string[] | undefined>);

  let body: unknown = null;
  if (c.req.method === "POST" || c.req.method === "PATCH") {
    const raw = await c.req.text();
    body = parseJsonBody(raw || null);
  }

  return {
    method: c.req.method,
    path,
    params: {},
    query,
    body,
  };
}

export function createHonoHandler(engine: ConversationEngine, options?: CreateHonoHandlerOptions) {
  const basePath = options?.basePath ?? "";

  return async (c: Context) => {
    const coreReq = await toCoreRequest(c);
    const coreRes = await dispatch(engine, coreReq, basePath);

    if (coreRes.status === 204) {
      return c.body(null, 204);
    }
    return c.json(coreRes.body ?? null, coreRes.status as 200 | 201 | 400 | 401 | 403 | 404 | 500);
  };
}
