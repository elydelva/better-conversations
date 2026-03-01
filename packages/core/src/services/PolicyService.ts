import type { PolicyObject, ResolvedPolicy } from "../policy/index.js";

export class PolicyService {
  async resolve(
    _chatterId: string,
    _conversationId?: string,
    _threadParentBlockId?: string
  ): Promise<ResolvedPolicy> {
    // Stub: returns default policy. Merge engine to be implemented later.
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

  async setGlobal(_policy: Partial<PolicyObject>): Promise<void> {
    throw new Error("Not implemented: PolicyService.setGlobal");
  }

  async setRole(_role: string, _policy: Partial<PolicyObject>): Promise<void> {
    throw new Error("Not implemented: PolicyService.setRole");
  }

  async setChatter(_chatterId: string, _policy: Partial<PolicyObject>): Promise<void> {
    throw new Error("Not implemented: PolicyService.setChatter");
  }

  async setConversation(_conversationId: string, _policy: Partial<PolicyObject>): Promise<void> {
    throw new Error("Not implemented: PolicyService.setConversation");
  }

  async setThread(_threadParentBlockId: string, _policy: Partial<PolicyObject>): Promise<void> {
    throw new Error("Not implemented: PolicyService.setThread");
  }
}
