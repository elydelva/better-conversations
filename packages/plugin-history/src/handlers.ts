import type { ConversationEngine } from "@better-conversation/core";
import type { RouteHandler } from "@better-conversation/core";
import { successResponse } from "@better-conversation/core";
import type { HistoryService } from "./HistoryService.js";

function getHistory(engine: ConversationEngine): HistoryService {
  const history = engine.getPlugin<HistoryService>("history");
  if (!history) {
    throw new Error("History plugin not initialized");
  }
  return history;
}

export const handleBlockHistoryList: RouteHandler = async ({ engine, req }) => {
  const blockId = req.params.blockId;
  const list = await getHistory(engine).list(blockId);
  return successResponse(list);
};
