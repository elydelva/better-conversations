import type { PolicyObject } from "../policy/index.js";

export interface RegistryAdapter {
  upsertBlock(type: string, schemaJson: Record<string, unknown>, isBuiltIn: boolean): Promise<void>;
  upsertRole(
    name: string,
    extendsRole: string | null,
    policy: PolicyObject,
    isBuiltIn: boolean
  ): Promise<void>;
}
