import type { ConversationEngine, ConversationPlugin } from "@better-conversation/core";
import { PresenceService } from "./PresenceService.js";
import {
  handleParticipantsMarkRead,
  handleParticipantsPresence,
  handleParticipantsTyping,
} from "./handlers.js";
import { presenceSchemaContribution } from "./schema.js";

export const presencePlugin: ConversationPlugin = {
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

export { PresenceService } from "./PresenceService.js";
export type { PresenceInfo } from "./PresenceService.js";
export { presenceSchemaContribution } from "./schema.js";
