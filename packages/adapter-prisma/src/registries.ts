import type { PolicyObject, RegistryAdapter } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcBlockRegistry: {
    upsert: (args: {
      where: { type: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  bcRoleRegistry: {
    upsert: (args: {
      where: { name: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
};

export function createRegistriesAdapter(ctx: PrismaAdapterContext): RegistryAdapter {
  const { prisma } = ctx;
  const blockReg = (prisma as Prisma).bcBlockRegistry;
  const roleReg = (prisma as Prisma).bcRoleRegistry;

  return {
    async upsertBlock(type, schemaJson, isBuiltIn) {
      const schemaToStore =
        schemaJson && typeof schemaJson === "object" && Object.keys(schemaJson).length > 0
          ? schemaJson
          : {};
      await blockReg.upsert({
        where: { type },
        create: { type, schemaJson: schemaToStore, isBuiltIn },
        update: { schemaJson: schemaToStore, isBuiltIn },
      });
    },
    async upsertRole(name, extendsRole, policy, isBuiltIn) {
      await roleReg.upsert({
        where: { name },
        create: {
          name,
          extends: extendsRole,
          policy: policy as Record<string, unknown>,
          isBuiltIn,
        },
        update: {
          extends: extendsRole,
          policy: policy as Record<string, unknown>,
          isBuiltIn,
        },
      });
    },
  };
}
