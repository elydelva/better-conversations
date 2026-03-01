import type { PolicyAdapter } from "./PolicyAdapter.interface.js";

const NOT_IMPL =
  "Policy adapter not implemented. Use @better-conversation/adapter-drizzle for full support.";

export function createUnsupportedPolicyAdapter(): PolicyAdapter {
  return {
    async find() {
      return null;
    },
    async upsert() {
      throw new Error(NOT_IMPL);
    },
    async delete() {
      throw new Error(NOT_IMPL);
    },
  };
}
