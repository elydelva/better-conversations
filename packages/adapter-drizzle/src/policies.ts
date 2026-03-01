import type {
  PolicyAdapter,
  PolicyLevel,
  PolicyObject,
  StoredPolicy,
} from "@better-conversation/core";
import { and, eq } from "drizzle-orm";
import type { DrizzleAdapterContext } from "./shared";

function mapRowToStoredPolicy(
  row: Record<string, unknown>,
  level: PolicyLevel,
  scopeId: string
): StoredPolicy {
  const r = row as { policy?: unknown };
  return {
    level,
    scopeId,
    policy: (r.policy ?? {}) as Record<string, unknown> as PolicyObject,
  };
}

export function createPoliciesAdapter(ctx: DrizzleAdapterContext): PolicyAdapter {
  const { db, schema, helpers } = ctx;
  const { policies } = schema;

  return {
    async find(level, scopeId) {
      const result = await db
        .select()
        .from(policies)
        .where(and(eq(policies.level, level), eq(policies.scopeId, scopeId)))
        .limit(1);
      const row = result[0];
      return row ? mapRowToStoredPolicy(row, level, scopeId) : null;
    },
    async upsert(level, scopeId, policy) {
      const id = helpers.generateId();
      const now = helpers.now();
      const policyPayload = policy as Record<string, unknown>;

      await db
        .insert(policies)
        .values({
          id,
          level,
          scopeId,
          policy: policyPayload,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [policies.level, policies.scopeId],
          set: {
            policy: policyPayload,
            updatedAt: now,
          },
        });
    },
    async delete(level, scopeId) {
      await db
        .delete(policies)
        .where(and(eq(policies.level, level), eq(policies.scopeId, scopeId)));
    },
  };
}
