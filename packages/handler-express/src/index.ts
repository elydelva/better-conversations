import {
  type ConversationEngine,
  type CoreRequest,
  dispatch,
  parseJsonBody,
} from "@better-conversation/core";
import type { Request, RequestHandler, Response } from "express";

export interface CreateExpressHandlerOptions {
  basePath?: string;
}

function queryToRecord(q: Request["query"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q ?? {})) {
    if (v !== undefined && v !== null) {
      out[k] = Array.isArray(v) ? (v[0] as string) : String(v);
    }
  }
  return out;
}

async function toCoreRequest(req: Request): Promise<CoreRequest> {
  const path = req.path;
  const query = queryToRecord(req.query);

  let body: unknown = null;
  if (req.method === "POST" || req.method === "PATCH") {
    body =
      typeof req.body === "object" && req.body !== null
        ? req.body
        : parseJsonBody(req.body != null ? String(req.body) : null);
  }

  return {
    method: req.method,
    path,
    params: {},
    query,
    body,
  };
}

function sendResponse(res: Response, status: number, body?: unknown): void {
  if (status === 204) {
    res.sendStatus(204);
    return;
  }
  res.status(status).json(body ?? null);
}

export function createExpressHandler(
  engine: ConversationEngine,
  options?: CreateExpressHandlerOptions
): RequestHandler {
  const basePath = options?.basePath ?? "";

  return async (req: Request, res: Response) => {
    const coreReq = await toCoreRequest(req);
    const coreRes = await dispatch(engine, coreReq, basePath);
    sendResponse(res, coreRes.status, coreRes.body);
  };
}
