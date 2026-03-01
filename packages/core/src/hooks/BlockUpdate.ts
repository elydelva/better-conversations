import type { Block } from "../types/index.js";

export interface BlockBeforeUpdateCtx {
  block: Block;
  data: Partial<Pick<Block, "body" | "metadata">>;
}

export interface BlockAfterUpdateCtx {
  previousBlock: Block;
  block: Block;
  data: Partial<Pick<Block, "body" | "metadata">>;
  /** Engine reference for plugin hooks */
  engine?: unknown;
}
