import type { PolicyObject, RegistryAdapter } from "@better-conversation/core";
import type { DrizzleAdapterContext } from "./shared";

export function createRegistriesAdapter(ctx: DrizzleAdapterContext): RegistryAdapter {
  const { db, schema } = ctx;
  const { blockRegistry, roleRegistry } = schema;

  return {
    async upsertBlock(type: string, schemaJson: Record<string, unknown>, isBuiltIn: boolean) {
      const schemaToStore =
        schemaJson && typeof schemaJson === "object" && Object.keys(schemaJson).length > 0
          ? schemaJson
          : {};
      await db
        .insert(blockRegistry)
        .values({
          type,
          schemaJson: schemaToStore,
          isBuiltIn,
        })
        .onConflictDoUpdate({
          target: blockRegistry.type,
          set: {
            schemaJson: schemaToStore,
            isBuiltIn,
          },
        });
    },
    async upsertRole(
      name: string,
      extendsRole: string | null,
      policy: PolicyObject,
      isBuiltIn: boolean
    ) {
      await db
        .insert(roleRegistry)
        .values({
          name,
          extends: extendsRole,
          policy: policy as Record<string, unknown>,
          isBuiltIn,
        })
        .onConflictDoUpdate({
          target: roleRegistry.name,
          set: {
            extends: extendsRole,
            policy: policy as Record<string, unknown>,
            isBuiltIn,
          },
        });
    },
  };
}
