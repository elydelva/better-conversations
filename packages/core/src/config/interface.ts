import type { DatabaseAdapter } from "../adapter/index.js";
import type { ConversationHooks } from "../hooks/index.js";
import type { PolicyConfig } from "../policy/index.js";
import type { BlockRegistry, RoleRegistry } from "../registry/index.js";

export type { ConversationPlugin } from "./Plugin.interface.js";

export interface ConversationConfig<
  TBlocks extends BlockRegistry = BlockRegistry,
  TRoles extends RoleRegistry = RoleRegistry,
> {
  adapter: DatabaseAdapter;
  additionalBlocks?: TBlocks;
  additionalRoles?: TRoles;
  hooks?: ConversationHooks<TBlocks, TRoles>;
  policies?: PolicyConfig<TRoles>;
  plugins?: ConversationPlugin[];
  tablePrefix?: string;
  generateId?: () => string;
}
