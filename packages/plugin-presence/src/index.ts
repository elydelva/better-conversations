import type { ConversationEngine, ConversationPlugin } from "@better-conversation/core";
import { PresenceService } from "./PresenceService.js";
import {
  handleParticipantsMarkRead,
  handleParticipantsPresence,
  handleParticipantsTyping,
} from "./handlers.js";
import { presenceSchemaContribution } from "./schema.js";

export type PresencePluginOptions = Record<string, never>;

/**
 * Creates the presence plugin. Enables typing indicators, read receipts, and presence tracking.
 *
 * @example
 * betterConversation({
 *   adapter,
 *   plugins: [createPresencePlugin()],
 * });
 */
const EMPTY_PRESENCE_OPTIONS: PresencePluginOptions = {};
export function createPresencePlugin(
  _options: PresencePluginOptions = EMPTY_PRESENCE_OPTIONS
): ConversationPlugin {
  return {
    name: "presence",
    version: "1.0.0",

    schemaContribution: presenceSchemaContribution,

    createServices: (engine: ConversationEngine, _config: unknown) => ({
      presence: new PresenceService(engine),
    }),

    routes: [
      {
        method: "PATCH",
        path: "/conversations/:id/participants/:chatterId/read",
        handler: handleParticipantsMarkRead,
      },
      {
        method: "PATCH",
        path: "/conversations/:id/participants/:chatterId/typing",
        handler: handleParticipantsTyping,
      },
      {
        method: "GET",
        path: "/conversations/:id/participants/presence",
        handler: handleParticipantsPresence,
      },
    ],

    hooks: {
      onParticipantAfterJoin: async (ctx) => {
        const eng = ctx.engine as ConversationEngine | undefined;
        const p = ctx.participant;
        if (eng && p) {
          await eng.participants.update(p.id, {
            lastSeenAt: new Date(),
          });
        }
      },
    },
  };
}

export { PresenceService } from "./PresenceService.js";
export type { PresenceInfo } from "./PresenceService.js";
export { presenceSchemaContribution } from "./schema.js";
