import type { DatabaseAdapter } from "../adapter/index.js";
import type { AuditStore } from "../audit/index.js";
import type { ConversationHooks } from "../hooks/index.js";
import type { PolicyConfig } from "../policy/index.js";
import type { BlockRegistry, RoleRegistry } from "../registry/index.js";
import type { ConversationPlugin } from "./Plugin.interface.js";
import type { SecurityConfig } from "./SecurityConfig.interface.js";

export type { ConversationPlugin };

export interface ConversationConfig<
  TBlocks extends BlockRegistry = BlockRegistry,
  TRoles extends RoleRegistry = RoleRegistry,
> {
  adapter: DatabaseAdapter;
  /** When provided, core appends audit entries for block:created and conversation:created */
  audit?: { store: AuditStore };
  additionalBlocks?: TBlocks;
  additionalRoles?: TRoles;
  hooks?: ConversationHooks<TBlocks, TRoles>;
  policies?: PolicyConfig<TRoles>;
  plugins?: ConversationPlugin[];
  tablePrefix?: string;
  generateId?: () => string;
  /** Configuration de sécurité. Valeurs par défaut restrictives si absent. */
  security?: Partial<SecurityConfig>;
}
