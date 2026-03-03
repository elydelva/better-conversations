import { createHonoHandler as createAgnosticHonoHandler } from "@better-agnostic/handler-hono";
import type { ConversationEngine } from "@better-conversation/core";
import type { Context } from "hono";

export interface CreateHonoHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use session, JWT, etc. */
  getCurrentChatter?: (c: Context) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

export function createHonoHandler(engine: ConversationEngine, options?: CreateHonoHandlerOptions) {
  const getCurrentChatter = options?.getCurrentChatter;
  return createAgnosticHonoHandler(engine, {
    basePath: options?.basePath,
    getAuthContext: getCurrentChatter
      ? async (c) => {
          const id = await Promise.resolve(getCurrentChatter(c));
          return id != null ? { chatterId: id } : null;
        }
      : undefined,
    requireAuth: options?.requireAuth,
  });
}
