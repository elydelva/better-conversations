import type { PolicyObject } from "../policy/index.js";

export interface CreateRoleOptions {
  name: string;
  extends?: string;
  policy: PolicyObject;
}
