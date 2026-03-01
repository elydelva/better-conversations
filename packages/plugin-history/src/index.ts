import type {
  ConversationConfig,
  ConversationEngine,
  ConversationPlugin,
} from "@better-conversation/core";
import { HistoryService } from "./HistoryService.js";
import type { BlockHistoryAdapter } from "./HistoryService.js";
import { handleBlockHistoryList } from "./handlers.js";
import { historySchemaContribution } from "./schema.js";

export type HistoryPluginOptions = Record<string, never>;

/**
 * Creates the history plugin. Enables block edit history tracking.
 *
 * @example
 * betterConversation({
 *   adapter,
 *   plugins: [createHistoryPlugin()],
 * });
 */
const EMPTY_HISTORY_OPTIONS: HistoryPluginOptions = {};
export function createHistoryPlugin(
  _options: HistoryPluginOptions = EMPTY_HISTORY_OPTIONS
): ConversationPlugin {
  return {
    name: "history",
    version: "1.0.0",

    schemaContribution: historySchemaContribution,

    createServices: (_engine: unknown, config: unknown) => {
      const adapter = (config as ConversationConfig).adapter;
      const historyAdapter = adapter?.extensions?.history as BlockHistoryAdapter | undefined;
      if (!historyAdapter) {
        throw new Error(
          "History plugin requires adapter with history extension. Use drizzleAdapter with plugins including createHistoryPlugin()."
        );
      }
      return {
        history: new HistoryService(historyAdapter),
      };
    },

    routes: [
      {
        method: "GET",
        path: "/conversations/:id/blocks/:blockId/history",
        handler: handleBlockHistoryList,
      },
    ],

    hooks: {
      onBlockAfterUpdate: async (ctx) => {
        const eng = ctx.engine as ConversationEngine | undefined;
        const history = eng?.getPlugin<HistoryService>("history");
        if (!history) return;
        const { previousBlock, data } = ctx;
        if (data.body !== undefined || data.metadata !== undefined) {
          await history.record(
            previousBlock.id,
            {
              body: previousBlock.body ?? null,
              metadata: previousBlock.metadata ?? null,
            },
            null,
            new Date()
          );
        }
      },
    },
  };
}

export { HistoryService } from "./HistoryService.js";
export type { BlockHistoryEntry } from "./HistoryService.js";
export { historySchemaContribution } from "./schema.js";
