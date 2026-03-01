import type { PermissionAdapter } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcChatterPermission: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<{ granted: boolean } | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  };
};

export function createPermissionsAdapter(ctx: PrismaAdapterContext): PermissionAdapter {
  const { prisma, helpers } = ctx;
  const p = (prisma as Prisma).bcChatterPermission;

  return {
    async check(chatterId, action, scope) {
      const where: Record<string, unknown> = {
        chatterId,
        action,
      };
      if (scope != null) {
        where.scope = scope;
      } else {
        where.scope = null;
      }
      const row = await p.findFirst({ where });
      return row ? row.granted : false;
    },
    async grant(chatterId, action, scope) {
      const id = helpers.generateId();
      await p.create({
        data: {
          id,
          chatterId,
          action,
          scope: scope ?? null,
          granted: true,
        },
      });
    },
    async revoke(chatterId, action, scope) {
      const where: Record<string, unknown> = {
        chatterId,
        action,
      };
      if (scope != null) {
        where.scope = scope;
      } else {
        where.scope = null;
      }
      await p.deleteMany({ where });
    },
  };
}
