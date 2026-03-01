import type { BlockInput } from "../types/index.js";

export interface RefuseOptions {
  code?: string;
  expose?: boolean;
  retryAfter?: number;
}

export type HookResult =
  | { type: "next" }
  | { type: "refuse"; reason: string; options?: RefuseOptions }
  | { type: "transform"; data: BlockInput }
  | { type: "flag"; reason: string }
  | { type: "defer"; fn: () => Promise<void> }
  | { type: "queue" };
