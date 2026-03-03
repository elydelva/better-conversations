import { createNextHandler as createAgnosticNextHandler } from "@better-agnostic/handler-next";
import type { ConversationEngine } from "@better-conversation/core";
import type { NextRequest } from "next/server";

export interface CreateNextHandlerOptions {
  basePath?: string;
  /** Returns the authenticated chatter ID from the request. Use getServerSession, JWT, etc. */
  getCurrentChatter?: (req: NextRequest) => Promise<string | null> | string | null;
  /** If true, return 401 when getCurrentChatter returns null */
  requireAuth?: boolean;
}

export function createNextHandler(engine: ConversationEngine, options?: CreateNextHandlerOptions) {
  const getCurrentChatter = options?.getCurrentChatter;
  return createAgnosticNextHandler(engine, {
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
