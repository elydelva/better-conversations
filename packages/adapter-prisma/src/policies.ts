import type {
  PolicyAdapter,
  PolicyLevel,
  PolicyObject,
  StoredPolicy,
} from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcPolicy: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PolicyRow | null>;
    upsert: (args: {
      where: { level_scopeId: { level: string; scopeId: string } };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<unknown>;
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  };
};

interface PolicyRow {
  level: string;
  scopeId: string;
  policy: unknown;
}

export function createPoliciesAdapter(ctx: PrismaAdapterContext): PolicyAdapter {
  const { prisma, helpers } = ctx;
  const p = (prisma as Prisma).bcPolicy;

  return {
    async find(level, scopeId) {
      const row = await p.findFirst({
        where: { level, scopeId },
      });
      if (!row) return null;
      return {
        level: level as PolicyLevel,
        scopeId,
        policy: (row.policy ?? {}) as PolicyObject,
      };
    },
    async upsert(level, scopeId, policy) {
      const id = helpers.generateId();
      const policyPayload = policy as Record<string, unknown>;
      await p.upsert({
        where: { level_scopeId: { level, scopeId } },
        create: {
          id,
          level,
          scopeId,
          policy: policyPayload,
        },
        update: { policy: policyPayload },
      });
    },
    async delete(level, scopeId) {
      await p.deleteMany({ where: { level, scopeId } });
    },
  };
}
