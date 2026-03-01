import {
  type ConversationEngine,
  type CoreRequest,
  dispatch,
  parseJsonBody,
  queryToRecord,
} from "@better-conversation/core";
import type { Request, RequestHandler, Response } from "express";

export interface CreateExpressHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use session, JWT, etc. */
  getCurrentChatter?: (req: Request) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

async function toCoreRequest(
  req: Request,
  options?: CreateExpressHandlerOptions
): Promise<CoreRequest> {
  const path = req.path;
  const query = queryToRecord(req.query as Record<string, unknown>);

  let body: unknown = null;
  if (req.method === "POST" || req.method === "PATCH") {
    body =
      typeof req.body === "object" && req.body !== null
        ? req.body
        : parseJsonBody(req.body != null ? String(req.body) : null);
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

async function sendResponse(
  res: Response,
  status: number,
  body?: unknown,
  options?: { stream?: ReadableStream; headers?: Record<string, string> }
): Promise<void> {
  if (options?.stream) {
    res.writeHead(status, options.headers);
    const reader = options.stream.getReader();
    const pump = (): Promise<void> =>
      reader.read().then(({ done, value }) => {
        if (done) {
          res.end();
          return Promise.resolve();
        }
        res.write(Buffer.from(value));
        return pump();
      });
    await pump();
    return;
  }
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
    const coreReq = await toCoreRequest(req, options);
    if (options?.requireAuth && options?.getCurrentChatter && !coreReq.auth) {
      res.status(401).end();
      return;
    }
    const coreRes = await dispatch(engine, coreReq, basePath);
    await sendResponse(res, coreRes.status, coreRes.body, {
      stream: coreRes.stream,
      headers: coreRes.headers,
    });
  };
}
