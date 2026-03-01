import type { RoleDefinition } from "../registry/index.js";
import type { CreateRoleOptions } from "./interface.js";

export function createRole(options: CreateRoleOptions): RoleDefinition {
  return {
    name: options.name,
    extends: options.extends,
    policy: options.policy,
  };
}
