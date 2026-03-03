import type { ConversationEngine, ConversationPlugin } from "@better-conversation/core";
import { BlockRefusedError } from "@better-conversation/errors";
import { handlePoliciesSetThread } from "./handlers.js";

export interface ThreadPluginOptions {
  /** Optional: custom error message when threads are disabled */
  threadsDisabledMessage?: string;
}

/**
 * Creates the thread plugin. Enables thread-specific policies and hooks.
 */
export function createThreadPlugin(options: ThreadPluginOptions = {}): ConversationPlugin {
  return {
    name: "thread",
    version: "1.0.0",

    routes: [
      {
        method: "PATCH",
        path: "/policies/conversations/:id/threads/:blockId",
        handler: handlePoliciesSetThread,
      },
    ],

    hooks: {
      onBlockBeforeSend: async (ctx, outcomes) => {
        const { engine, isThread, isFirstReply, resolvedPolicy, block, adapter } = ctx;

        if (!resolvedPolicy) return outcomes.next();

        // 1. Enforce threadsEnabled
        if (isThread && resolvedPolicy.threadsEnabled === false) {
          throw new BlockRefusedError(
            options.threadsDisabledMessage ?? "Threads are disabled in this conversation",
            { code: "THREADS_DISABLED", expose: true }
          );
        }

        // 2. Enforce threadClosed
        if (isThread && resolvedPolicy.threadClosed) {
          throw new BlockRefusedError("Thread is closed", {
            code: "THREAD_CLOSED",
            expose: true,
          });
        }

        // 3. Enforce maxThreadDepth
        // Note: isThread is true if threadParentId is present.
        // Currently we only support 1 level of nesting in core data model (threadParentId).
        if (isThread && resolvedPolicy.maxThreadDepth === 0) {
          throw new BlockRefusedError("Threads are not allowed", {
            code: "MAX_THREAD_DEPTH_EXCEEDED",
            expose: true,
          });
        }

        // 4. Enforce maxThreadReplies
        if (isThread && resolvedPolicy.maxThreadReplies != null && block.threadParentId) {
          const result = await adapter.blocks.list({
            conversationId: block.conversationId,
            threadParentId: block.threadParentId,
            limit: resolvedPolicy.maxThreadReplies + 1,
          });
          if (result.items.length >= resolvedPolicy.maxThreadReplies) {
            throw new BlockRefusedError(
              `Thread has reached maximum number of replies (${resolvedPolicy.maxThreadReplies})`,
              {
                code: "MAX_THREAD_REPLIES_EXCEEDED",
                expose: true,
              }
            );
          }
        }

        // 5. Fire onThreadCreated when this is the first reply in a thread
        if (isFirstReply && block.threadParentId && engine) {
          const hooks = (engine as ConversationEngine).getHooks();
          if (hooks?.onThreadCreated) {
            const parentBlock = await adapter.blocks.find(block.threadParentId);
            if (parentBlock) {
              const res = await hooks.onThreadCreated({ ...ctx, parentBlock }, outcomes);
              if (res.type !== "next") return res;
            }
          }
        }

        return outcomes.next();
      },
    },
  };
}
