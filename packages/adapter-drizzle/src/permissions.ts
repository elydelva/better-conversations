import type { PermissionAdapter } from "@better-conversation/core";
import { and, eq, isNull } from "drizzle-orm";
import type { DrizzleAdapterContext } from "./shared.js";

export function createPermissionsAdapter(ctx: DrizzleAdapterContext): PermissionAdapter {
  const { db, schema, helpers } = ctx;
  const { chatterPermissions } = schema;

  return {
    async check(chatterId, action, scope) {
      const conditions = [
        eq(chatterPermissions.chatterId, chatterId),
        eq(chatterPermissions.action, action),
        scope != null ? eq(chatterPermissions.scope, scope) : isNull(chatterPermissions.scope),
      ];
      const result = await db
        .select()
        .from(chatterPermissions)
        .where(and(...conditions))
        .limit(1);
      const row = result[0];
      return row ? (row.granted as boolean) : false;
    },
    async grant(chatterId, action, scope) {
      const id = helpers.generateId();
      await db.insert(chatterPermissions).values({
        id,
        chatterId,
        action,
        scope: scope ?? null,
        granted: true,
      });
    },
    async revoke(chatterId, action, scope) {
      const conditions = [
        eq(chatterPermissions.chatterId, chatterId),
        eq(chatterPermissions.action, action),
        scope != null ? eq(chatterPermissions.scope, scope) : isNull(chatterPermissions.scope),
      ];
      await db.delete(chatterPermissions).where(and(...conditions));
    },
  };
}
