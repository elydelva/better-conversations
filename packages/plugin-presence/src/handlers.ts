import type { ConversationEngine } from "@better-conversation/core";
import type { RouteHandler } from "@better-conversation/core";
import { successResponse } from "@better-conversation/core";
import type { PresenceService } from "./PresenceService.js";
import { parseTypingBody } from "./schemas.js";

function getPresence(engine: ConversationEngine): PresenceService {
  const presence = engine.getPlugin<PresenceService>("presence");
  if (!presence) {
    throw new Error("Presence plugin not initialized");
  }
  return presence;
}

export const handleParticipantsMarkRead: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const chatterId = req.params.chatterId;
  await getPresence(engine).markRead(conversationId, chatterId);
  return successResponse(null, 204);
};

export const handleParticipantsTyping: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const chatterId = req.params.chatterId;
  const { untilMs } = parseTypingBody(req.body);
  const until = new Date(Date.now() + untilMs);
  await getPresence(engine).setTyping(conversationId, chatterId, until);
  return successResponse(null, 204);
};

export const handleParticipantsPresence: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const list = await getPresence(engine).getPresence(conversationId);
  return successResponse(list);
};
