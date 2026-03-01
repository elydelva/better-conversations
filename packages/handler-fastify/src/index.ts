import {
  type ConversationEngine,
  type CoreRequest,
  dispatch,
  parseJsonBody,
} from "@better-conversation/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export interface CreateFastifyHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use session, JWT, etc. */
  getCurrentChatter?: (req: FastifyRequest) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

function queryToRecord(q: FastifyRequest["query"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q ?? {})) {
    if (v !== undefined && v !== null) {
      out[k] = Array.isArray(v) ? (v[0] as string) : String(v);
    }
  }
  return out;
}

function getPath(req: FastifyRequest): string {
  const url = req.url;
  return url.includes("?") ? url.slice(0, url.indexOf("?")) : url;
}

async function toCoreRequest(
  req: FastifyRequest,
  options?: CreateFastifyHandlerOptions
): Promise<CoreRequest> {
  const path = getPath(req);
  const query = queryToRecord(req.query);

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
  reply: FastifyReply,
  status: number,
  body?: unknown,
  options?: { stream?: ReadableStream; headers?: Record<string, string> }
): Promise<void> {
  if (options?.stream) {
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        reply.raw.setHeader(k, v);
      }
    }
    reply.raw.writeHead(status);
    const reader = options.stream.getReader();
    const pump = (): Promise<void> =>
      reader.read().then(({ done, value }) => {
        if (done) {
          reply.raw.end();
          return Promise.resolve();
        }
        reply.raw.write(Buffer.from(value));
        return pump();
      });
    await pump();
    return;
  }
  if (status === 204) {
    reply.status(204).send();
    return;
  }
  reply.status(status).send(body ?? null);
}

export function createFastifyHandler(
  engine: ConversationEngine,
  options?: CreateFastifyHandlerOptions
) {
  const basePathFromOptions = options?.basePath ?? "";

  return async function fastifyConversationPlugin(
    fastify: FastifyInstance,
    opts: { prefix?: string }
  ): Promise<void> {
    const basePath = basePathFromOptions || opts?.prefix || "";

    const handlerOptions = options ?? {};
    const handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const coreReq = await toCoreRequest(req, handlerOptions);
      if (handlerOptions.requireAuth && handlerOptions.getCurrentChatter && !coreReq.auth) {
        await reply.status(401).send();
        return;
      }
      const coreRes = await dispatch(engine, coreReq, basePath);
      await sendResponse(reply, coreRes.status, coreRes.body, {
        stream: coreRes.stream,
        headers: coreRes.headers,
      });
    };

    fastify.route({
      method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      url: "/*",
      handler,
    });
  };
}
