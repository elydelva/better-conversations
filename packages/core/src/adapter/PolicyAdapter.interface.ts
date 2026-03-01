import type { PolicyObject } from "../policy/index.js";

export type PolicyLevel = "global" | "role" | "chatter" | "conversation" | "thread";

export interface StoredPolicy {
  level: PolicyLevel;
  scopeId: string;
  policy: PolicyObject;
}

export interface PolicyAdapter {
  find(level: PolicyLevel, scopeId: string): Promise<StoredPolicy | null>;
  upsert(level: PolicyLevel, scopeId: string, policy: PolicyObject): Promise<void>;
  delete(level: PolicyLevel, scopeId: string): Promise<void>;
}
