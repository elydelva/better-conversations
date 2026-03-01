import type { PolicyObject } from "./PolicyObject.interface.js";

export type MergeStrategy = "override" | "restrict";

export interface PolicyResolveContext {
  chatterId: string;
  conversationId?: string;
  threadParentBlockId?: string;
  role?: string;
}

export interface PolicyConfig<TRoles extends Record<string, unknown> = Record<string, unknown>> {
  global?: PolicyObject;
  roles?: Partial<Record<string, PolicyObject>>;
  mergeStrategy?: MergeStrategy;
  onResolve?: (
    resolved: PolicyObject,
    ctx: PolicyResolveContext
  ) => Promise<PolicyObject> | PolicyObject;
}
