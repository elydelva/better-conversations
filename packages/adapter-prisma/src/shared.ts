/**
 * Shared context for Prisma adapter.
 * prisma: PrismaClient generated from schema that includes better-conversation models.
 */
import type { createAdapterHelpers } from "@better-conversation/core";

export interface PrismaAdapterContext {
  prisma: unknown;
  helpers: ReturnType<typeof createAdapterHelpers>;
}
