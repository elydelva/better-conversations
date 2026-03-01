import { createAdapterHelpers } from "@better-conversation/core";
import type { DatabaseAdapter } from "@better-conversation/core";
import { buildSchema } from "@better-conversation/core/schema";
import type { SchemaContributor } from "@better-conversation/core/schema";
import { createBlockHistoryAdapter } from "./block-history";
import { createBlocksAdapter } from "./blocks";
import { createChattersAdapter } from "./chatters";
import { createConversationsAdapter } from "./conversations";
import { createParticipantsAdapter } from "./participants";
import { createPermissionsAdapter } from "./permissions";
import { createPoliciesAdapter } from "./policies";
import { createRegistriesAdapter } from "./registries";
import { createSchema } from "./schema";
import { createSchemaSqlite } from "./schema.sqlite";
import { translateToDrizzle } from "./schema/translate";
import type { DrizzleAdapterContext } from "./shared";

export interface DrizzleAdapterOptions {
  provider?: "pg" | "sqlite" | "mysql";
  tablePrefix?: string;
  generateId?: () => string;
  /** When provided, uses buildSchema + translateToDrizzle instead of createSchema (PG only) */
  plugins?: SchemaContributor[];
}

export function drizzleAdapter(
  db: DrizzleAdapterContext["db"],
  options?: DrizzleAdapterOptions
): DatabaseAdapter {
  const prefix = options?.tablePrefix ?? "bc_";
  const provider = options?.provider ?? "pg";
  const helpers = createAdapterHelpers({
    tablePrefix: prefix,
    generateId: options?.generateId,
  });

  let schema: DrizzleAdapterContext["schema"];
  if (provider === "pg" && options?.plugins && options.plugins.length > 0) {
    const merged = buildSchema(options.plugins, { tablePrefix: prefix });
    schema = translateToDrizzle(merged, { tablePrefix: prefix });
  } else {
    schema = provider === "sqlite" ? createSchemaSqlite(prefix) : createSchema(prefix);
  }

  const ctx = { db, schema, helpers };

  const historyAdapter =
    provider === "pg" &&
    options?.plugins &&
    options.plugins.length > 0 &&
    (schema as { blockHistory?: unknown }).blockHistory
      ? createBlockHistoryAdapter(ctx as Parameters<typeof createBlockHistoryAdapter>[0])
      : undefined;

  return {
    chatters: createChattersAdapter(ctx),
    conversations: createConversationsAdapter(ctx),
    participants: createParticipantsAdapter(ctx),
    blocks: createBlocksAdapter(ctx),
    permissions: createPermissionsAdapter(ctx),
    registries: createRegistriesAdapter(ctx),
    policies: createPoliciesAdapter(ctx),
    extensions: {
      ...(historyAdapter && { history: historyAdapter }),
    },
  };
}

export { createSchema } from "./schema";
export { createSchemaSqlite } from "./schema.sqlite";
