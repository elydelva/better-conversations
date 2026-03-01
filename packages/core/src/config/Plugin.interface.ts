import type { Route } from "../handler/routes.js";
import type { ConversationHooks } from "../hooks/index.js";
import type { SchemaContribution } from "../schema/index.js";

/**
 * Extended plugin interface for core extensibility.
 * Plugins can add routes, hooks, services, and schema contributions.
 */
export interface ConversationPlugin<
  TBlocks extends Record<string, unknown> = Record<string, unknown>,
  TRoles extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  version?: string;

  /** Services attached to engine (e.g. engine.presence, engine.history) */
  createServices?: (engine: unknown, config: unknown) => Record<string, unknown>;

  /** Routes added to dispatch (merged with core routes) */
  routes?: Route[];

  /** Hooks merged with config.hooks (later overrides earlier) */
  hooks?: Partial<ConversationHooks<TBlocks, TRoles>>;

  /** Schema contribution for adapters (Schema Language) */
  schemaContribution?: SchemaContribution;

  init?(engine: unknown): Promise<void> | void;
}
