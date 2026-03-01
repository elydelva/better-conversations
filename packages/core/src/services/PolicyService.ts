import type { DatabaseAdapter } from "../adapter/index.js";
import type { PolicyAdapter } from "../adapter/index.js";
import type {
  MergeStrategy,
  PolicyConfig,
  PolicyObject,
  PolicyResolveContext,
  ResolvedPolicy,
} from "../policy/index.js";
import { mergePolicyLevels } from "../policy/mergePolicy.js";
import type { RoleRegistry } from "../registry/index.js";

const GLOBAL_SCOPE_ID = "global";

export interface PolicyServiceConfig {
  adapter: DatabaseAdapter;
  policiesConfig?: PolicyConfig;
  roleRegistry: RoleRegistry;
}

export class PolicyService {
  constructor(private readonly config: PolicyServiceConfig) {}

  private get policyAdapter(): PolicyAdapter {
    return this.config.adapter.policies;
  }

  async resolve(
    chatterId: string,
    conversationId?: string,
    threadParentBlockId?: string
  ): Promise<ResolvedPolicy> {
    const { adapter, policiesConfig, roleRegistry } = this.config;
    const strategy: MergeStrategy = policiesConfig?.mergeStrategy ?? "override";
    const levels: Partial<PolicyObject>[] = [];

    const [globalRow, participant, chatterRow, convRow, threadRow] = await Promise.all([
      policiesConfig?.global
        ? Promise.resolve(null)
        : adapter.policies.find("global", GLOBAL_SCOPE_ID),
      conversationId ? adapter.participants.find(conversationId, chatterId) : Promise.resolve(null),
      adapter.policies.find("chatter", chatterId),
      conversationId
        ? adapter.policies.find("conversation", conversationId)
        : Promise.resolve(null),
      threadParentBlockId
        ? adapter.policies.find("thread", threadParentBlockId)
        : Promise.resolve(null),
    ]);

    const globalPolicy = policiesConfig?.global ?? globalRow?.policy;
    if (globalPolicy) levels.push(globalPolicy);

    let role = "member";
    if (participant?.role) role = participant.role;

    const rolePolicy =
      roleRegistry[role]?.policy ??
      policiesConfig?.roles?.[role] ??
      (await adapter.policies.find("role", role))?.policy;
    if (rolePolicy) levels.push(rolePolicy);

    const chatterPolicy = chatterRow?.policy;
    if (chatterPolicy) levels.push(chatterPolicy);

    const convPolicy = convRow?.policy;
    if (convPolicy) levels.push(convPolicy);

    const threadPolicy = threadRow?.policy;
    if (threadPolicy) levels.push(threadPolicy);

    let resolved = mergePolicyLevels(levels, strategy);

    if (policiesConfig?.onResolve) {
      const ctx: PolicyResolveContext = {
        chatterId,
        conversationId,
        threadParentBlockId,
        role,
      };
      resolved = await Promise.resolve(policiesConfig.onResolve(resolved, ctx));
    }
    resolved.canJoinSelf = false;
    return resolved as ResolvedPolicy;
  }

  async setGlobal(policy: Partial<PolicyObject>): Promise<void> {
    await this.policyAdapter.upsert("global", GLOBAL_SCOPE_ID, policy as PolicyObject);
  }

  async setRole(role: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.policyAdapter.upsert("role", role, policy as PolicyObject);
  }

  async setChatter(chatterId: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.policyAdapter.upsert("chatter", chatterId, policy as PolicyObject);
  }

  async setConversation(conversationId: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.policyAdapter.upsert("conversation", conversationId, policy as PolicyObject);
  }

  async setThread(threadParentBlockId: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.policyAdapter.upsert("thread", threadParentBlockId, policy as PolicyObject);
  }

  listRoles(): string[] {
    return Object.keys(this.config.roleRegistry);
  }
}
