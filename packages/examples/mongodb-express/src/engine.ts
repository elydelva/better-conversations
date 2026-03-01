import { mongodbAdapter } from "@better-conversation/adapter-mongodb";
import { betterConversation } from "@better-conversation/core";
import type { ConversationEngine } from "@better-conversation/core";

const adapter = mongodbAdapter();

let engine: ConversationEngine | null = null;

export async function getEngine(): Promise<ConversationEngine> {
  if (!engine) {
    engine = betterConversation({
      adapter,
      security: {
        requireAuth: false,
        participantAccessControl: false,
        allowListChatters: true,
        allowListConversations: true,
        allowListConversationsByEntity: true,
        archiveRequiresPermission: false,
        addParticipantRequiresRole: false,
        removeParticipantRequiresRole: false,
        setRoleRequiresAdmin: false,
        grantRevokePermissionsRequiresAdmin: false,
        policyWriteRequiresAdmin: false,
      },
    });
    await engine.init();
  }
  return engine;
}
