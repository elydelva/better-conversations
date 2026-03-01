import type { ConversationConfig } from "./config/index.js";
import { ConversationEngine } from "./engine.js";
import type { BlockRegistry, RoleRegistry } from "./registry/index.js";

export function betterConversation<
  TBlocks extends BlockRegistry = BlockRegistry,
  TRoles extends RoleRegistry = RoleRegistry,
>(config: ConversationConfig<TBlocks, TRoles>): ConversationEngine<TBlocks, TRoles> {
  return new ConversationEngine(config);
}
