import { isConversationError, toJsonPayload } from "@better-conversation/errors";
import type { CoreResponse } from "./types.js";

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
