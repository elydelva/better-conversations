import type { PolicyAdapter } from "../adapter/index.js";
import type { PolicyObject, ResolvedPolicy } from "../policy/index.js";

const GLOBAL_SCOPE_ID = "global";

export interface PolicyServiceConfig {
  adapter: PolicyAdapter;
}

export class PolicyService {
  constructor(private readonly config: PolicyServiceConfig) {}

  async resolve(
    _chatterId: string,
    _conversationId?: string,
    _threadParentBlockId?: string
  ): Promise<ResolvedPolicy> {
    // Stub: returns default policy. Merge engine to be implemented in feat/merge-engine.
    return {
      canJoinSelf: false,
      readOnly: false,
      threadClosed: false,
      allowedBlocks: ["text"],
      deniedBlocks: [],
      maxBlockBodyLength: 4000,
      canEditOwnBlocks: true,
      canDeleteOwnBlocks: true,
      editWindowSeconds: 300,
      maxBlocksPerMinute: 20,
      maxBlocksPerHour: 200,
      sendCooldownMs: 500,
      threadsEnabled: true,
      maxThreadDepth: 1,
    };
  }

  async setGlobal(policy: Partial<PolicyObject>): Promise<void> {
    await this.config.adapter.upsert("global", GLOBAL_SCOPE_ID, policy as PolicyObject);
  }

  async setRole(role: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.config.adapter.upsert("role", role, policy as PolicyObject);
  }

  async setChatter(chatterId: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.config.adapter.upsert("chatter", chatterId, policy as PolicyObject);
  }

  async setConversation(conversationId: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.config.adapter.upsert("conversation", conversationId, policy as PolicyObject);
  }

  async setThread(threadParentBlockId: string, policy: Partial<PolicyObject>): Promise<void> {
    await this.config.adapter.upsert("thread", threadParentBlockId, policy as PolicyObject);
  }
}
