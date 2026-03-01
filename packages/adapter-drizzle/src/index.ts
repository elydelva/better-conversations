import { createAdapterHelpers } from "@better-conversation/core";
import type { DatabaseAdapter } from "@better-conversation/core";
import { createBlocksAdapter } from "./blocks";
import { createChattersAdapter } from "./chatters";
import { createConversationsAdapter } from "./conversations";
import { createParticipantsAdapter } from "./participants";
import { createPermissionsAdapter } from "./permissions";
import { createPoliciesAdapter } from "./policies";
import { createRegistriesAdapter } from "./registries";
import { createSchema } from "./schema";
import { createSchemaSqlite } from "./schema.sqlite";
import type { DrizzleAdapterContext } from "./shared";

export interface DrizzleAdapterOptions {
  provider?: "pg" | "sqlite" | "mysql";
  tablePrefix?: string;
  generateId?: () => string;
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
  const schema = provider === "sqlite" ? createSchemaSqlite(prefix) : createSchema(prefix);

  const ctx: DrizzleAdapterContext = { db, schema, helpers };

  return {
    chatters: createChattersAdapter(ctx),
    conversations: createConversationsAdapter(ctx),
    participants: createParticipantsAdapter(ctx),
    blocks: createBlocksAdapter(ctx),
    permissions: createPermissionsAdapter(ctx),
    registries: createRegistriesAdapter(ctx),
    policies: createPoliciesAdapter(ctx),
  };
}

export { createSchema } from "./schema";
export { createSchemaSqlite } from "./schema.sqlite";
