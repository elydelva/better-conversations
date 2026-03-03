import { createFastifyHandler as createAgnosticFastifyHandler } from "@better-agnostic/handler-fastify";
import type { ConversationEngine } from "@better-conversation/core";
import type { FastifyRequest } from "fastify";

export interface CreateFastifyHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use session, JWT, etc. */
  getCurrentChatter?: (req: FastifyRequest) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

export function createFastifyHandler(
  engine: ConversationEngine,
  options?: CreateFastifyHandlerOptions
) {
  const getCurrentChatter = options?.getCurrentChatter;
  return createAgnosticFastifyHandler(engine, {
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
