import type { PermissionAdapter } from "@better-conversation/core";
import type { MongoAdapterContext } from "./shared.js";

const NOT_IMPL =
  "@better-conversation/adapter-mongodb is not implemented. Use @better-conversation/adapter-drizzle.";

export function createPermissionsAdapter(_ctx: MongoAdapterContext): PermissionAdapter {
  return {
    async check() {
      throw new Error(NOT_IMPL);
    },
    async grant() {
      throw new Error(NOT_IMPL);
    },
    async revoke() {
      throw new Error(NOT_IMPL);
    },
  };
}
