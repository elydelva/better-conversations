import { createAdapterHelpers } from "@better-conversation/core";
import type { DatabaseAdapter } from "@better-conversation/core";
import { createBlocksAdapter } from "./blocks.js";
import { createChattersAdapter } from "./chatters.js";
import { createConversationsAdapter } from "./conversations.js";
import { createParticipantsAdapter } from "./participants.js";
import { createPermissionsAdapter } from "./permissions.js";
import type { PrismaAdapterContext } from "./shared.js";

export interface PrismaAdapterOptions {
  tablePrefix?: string;
  generateId?: () => string;
}

export function prismaAdapter(_client?: unknown, options?: PrismaAdapterOptions): DatabaseAdapter {
  const helpers = createAdapterHelpers({
    tablePrefix: options?.tablePrefix ?? "bc_",
    generateId: options?.generateId,
  });

  const ctx: PrismaAdapterContext = { helpers };

  return {
    chatters: createChattersAdapter(ctx),
    conversations: createConversationsAdapter(ctx),
    participants: createParticipantsAdapter(ctx),
    blocks: createBlocksAdapter(ctx),
    permissions: createPermissionsAdapter(ctx),
  };
}
