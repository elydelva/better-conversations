import { isConversationError, toJsonPayload } from "@better-conversation/errors";
import type { CoreResponse } from "./types.js";

/** Converts framework query objects to Record<string, string> for core handlers */
export function queryToRecord(
  q: Record<string, unknown> | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q ?? {})) {
    if (v !== undefined && v !== null) {
      out[k] = Array.isArray(v) ? (v[0] as string) : String(v);
    }
  }
  return out;
}

export function parseJsonBody(raw: string | null): unknown {
  if (!raw || raw.trim() === "") return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function errorToResponse(err: unknown): CoreResponse {
  if (isConversationError(err) && err.expose) {
    const payload = toJsonPayload(err);
    return {
      status: err.statusCode,
      body: payload,
    };
  }
  return {
    status: 500,
    body: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  };
}

export function successResponse(data: unknown, status = 200): CoreResponse {
  return { status, body: data };
}

/** Parses and bounds limit from query. Returns value between 1 and 100. */
export function parseLimit(queryLimit: string | undefined, defaultLimit = 50): number {
  const raw = queryLimit ? Number.parseInt(queryLimit, 10) : defaultLimit;
  if (Number.isNaN(raw) || raw < 1) return defaultLimit;
  return Math.min(raw, 100);
}

export function streamResponse(
  stream: ReadableStream,
  headers?: Record<string, string>
): CoreResponse {
  return {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...headers,
    },
    stream,
  };
}
