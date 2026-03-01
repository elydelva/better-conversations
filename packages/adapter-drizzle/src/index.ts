import { createAdapterHelpers } from "@better-conversation/core";
import type { DatabaseAdapter } from "@better-conversation/core";
import { createBlocksAdapter } from "./blocks.js";
import { createChattersAdapter } from "./chatters.js";
import { createConversationsAdapter } from "./conversations.js";
import { createParticipantsAdapter } from "./participants.js";
import { createPermissionsAdapter } from "./permissions.js";
import { createSchema } from "./schema.js";
import type { DrizzleAdapterContext } from "./shared.js";

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
  const helpers = createAdapterHelpers({
    tablePrefix: prefix,
    generateId: options?.generateId,
  });
  const schema = createSchema(prefix);

  const ctx: DrizzleAdapterContext = { db, schema, helpers };

  return {
    chatters: createChattersAdapter(ctx),
    conversations: createConversationsAdapter(ctx),
    participants: createParticipantsAdapter(ctx),
    blocks: createBlocksAdapter(ctx),
    permissions: createPermissionsAdapter(ctx),
  };
}

export { createSchema } from "./schema.js";
