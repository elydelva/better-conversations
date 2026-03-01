/**
 * Shared context for Prisma adapter parts.
 * To be implemented when adapter is built.
 */
import type { createAdapterHelpers } from "@better-conversation/core";

export interface PrismaAdapterContext {
  // PrismaClient when implemented
  helpers: ReturnType<typeof createAdapterHelpers>;
}
