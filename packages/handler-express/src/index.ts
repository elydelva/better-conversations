import { createExpressHandler as createAgnosticExpressHandler } from "@better-agnostic/handler-express";
import type { ConversationEngine } from "@better-conversation/core";
import type { Request, RequestHandler } from "express";

export interface CreateExpressHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use session, JWT, etc. */
  getCurrentChatter?: (req: Request) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

export function createExpressHandler(
  engine: ConversationEngine,
  options?: CreateExpressHandlerOptions
): RequestHandler {
  const getCurrentChatter = options?.getCurrentChatter;
  return createAgnosticExpressHandler(engine, {
    basePath: options?.basePath,
    getAuthContext: getCurrentChatter
      ? async (req) => {
          const id = await Promise.resolve(getCurrentChatter(req));
          return id != null ? { chatterId: id } : null;
        }
      : undefined,
    requireAuth: options?.requireAuth,
  });
}
