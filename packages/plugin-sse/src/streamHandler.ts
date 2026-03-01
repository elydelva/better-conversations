import type { RouteHandler } from "@better-conversation/core";
import { streamResponse } from "@better-conversation/core";
import { ConversationNotFoundError } from "@better-conversation/errors";

const SSE_POLL_INTERVAL_MS = 2000;

/**
 * SSE stream handler for real-time block updates.
 * Polls blocks periodically and streams block:created events (Edge-compatible).
 */
export const handleConversationsStream: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const conversation = await engine.conversations.find(conversationId);
  if (!conversation) {
    throw new ConversationNotFoundError(conversationId);
  }

  const encoder = new TextEncoder();
  const seenIds = new Set<string>();

  const sseStream = new ReadableStream({
    async pull(controller) {
      await new Promise((r) => setTimeout(r, SSE_POLL_INTERVAL_MS));
      try {
        const result = await engine.blocks.list({ conversationId, limit: 20 });
        const newBlocks = result.items.filter((b) => !seenIds.has(b.id) && b.status !== "deleted");
        for (const block of newBlocks) {
          seenIds.add(block.id);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: "block:created", block })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
      } catch (e) {
        console.warn("[SSE] Poll error for conversation", conversationId, e);
        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
      }
    },
  });

  return streamResponse(sseStream);
};
