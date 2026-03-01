import { createAdapterHelpers } from "@better-conversation/core";
import type { DatabaseAdapter } from "@better-conversation/core";
import { createBlocksAdapter } from "./blocks.js";
import { createChattersAdapter } from "./chatters.js";
import { createConversationsAdapter } from "./conversations.js";
import { createParticipantsAdapter } from "./participants.js";
import { createPermissionsAdapter } from "./permissions.js";
import { createPoliciesAdapter } from "./policies.js";
import { createRegistriesAdapter } from "./registries.js";
import type { PrismaAdapterContext } from "./shared.js";

export interface PrismaAdapterOptions {
  tablePrefix?: string;
  generateId?: () => string;
}

/**
 * Create a DatabaseAdapter using Prisma.
 * Pass your PrismaClient instance (generated from a schema that includes the bc_* models).
 * See schema.prisma in this package for the required models.
 */
export function prismaAdapter(prisma: unknown, options?: PrismaAdapterOptions): DatabaseAdapter {
  const helpers = createAdapterHelpers({
    tablePrefix: options?.tablePrefix ?? "bc_",
    generateId: options?.generateId,
  });

  const ctx: PrismaAdapterContext = { prisma, helpers };

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
