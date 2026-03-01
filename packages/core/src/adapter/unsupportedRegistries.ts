import type { RegistryAdapter } from "./RegistryAdapter.interface.js";

const NOT_IMPL =
  "Registry adapter not implemented. Use @better-conversation/adapter-drizzle for full support.";

export function createUnsupportedRegistriesAdapter(): RegistryAdapter {
  return {
    async upsertBlock() {
      throw new Error(NOT_IMPL);
    },
    async upsertRole() {
      throw new Error(NOT_IMPL);
    },
  };
}
