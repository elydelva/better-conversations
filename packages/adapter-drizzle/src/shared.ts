/**
 * Shared context and utilities for Drizzle adapter parts.
 * All parts implement the core adapter interfaces (ChatterAdapter, etc.).
 */
/* biome-ignore lint/suspicious/noExplicitAny: Drizzle fluent API requires untyped chain */
import type { createAdapterHelpers } from "@better-conversation/core";
import type { createSchema } from "./schema.js";

/* biome-ignore lint/suspicious/noExplicitAny: Drizzle fluent API requires untyped chain */
export type DrizzleDb = any;

export interface DrizzleAdapterContext {
  db: DrizzleDb;
  schema: ReturnType<typeof createSchema>;
  helpers: ReturnType<typeof createAdapterHelpers>;
}

export const toDate = (v: unknown): Date | null => (v ? new Date(v as string | Date) : null);

export const val = <T>(v: unknown, fallback: T): T =>
  v !== undefined && v !== null ? (v as T) : fallback;
