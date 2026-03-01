import type { Block } from "../types/index.js";
import type { BlockBeforeSendCtx } from "./BlockBeforeSend.js";

export interface ThreadCreatedCtx extends BlockBeforeSendCtx {
  parentBlock: Block;
}
