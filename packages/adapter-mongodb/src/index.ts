import {
  createAdapterHelpers,
  createUnsupportedPolicyAdapter,
  createUnsupportedRegistriesAdapter,
} from "@better-conversation/core";
import type { DatabaseAdapter } from "@better-conversation/core";
import { createBlocksAdapter } from "./blocks.js";
import { createChattersAdapter } from "./chatters.js";
import { createConversationsAdapter } from "./conversations.js";
import { createParticipantsAdapter } from "./participants.js";
import { createPermissionsAdapter } from "./permissions.js";
import type { MongoAdapterContext } from "./shared.js";

export interface MongoAdapterOptions {
  tablePrefix?: string;
  generateId?: () => string;
}

export function mongodbAdapter(_client?: unknown, options?: MongoAdapterOptions): DatabaseAdapter {
  const helpers = createAdapterHelpers({
    tablePrefix: options?.tablePrefix ?? "bc_",
    generateId: options?.generateId,
  });

  const ctx: MongoAdapterContext = { helpers };

  return {
    chatters: createChattersAdapter(ctx),
    conversations: createConversationsAdapter(ctx),
    participants: createParticipantsAdapter(ctx),
    blocks: createBlocksAdapter(ctx),
    permissions: createPermissionsAdapter(ctx),
    registries: createUnsupportedRegistriesAdapter(),
    policies: createUnsupportedPolicyAdapter(),
  };
}
