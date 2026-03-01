import type { ConversationEngine } from "@better-conversation/core";

export interface PresenceInfo {
  chatterId: string;
  lastReadAt?: Date | null;
  lastSeenAt?: Date | null;
  typingUntil?: Date | null;
}

/**
 * PresenceService — mark read, typing status, get presence.
 * Requires adapter with participants table extended by presence schema.
 */
export class PresenceService {
  constructor(private readonly engine: ConversationEngine) {}

  async markRead(conversationId: string, chatterId: string): Promise<void> {
    const participant = await this.engine.participants.find(conversationId, chatterId);
    if (!participant) {
      const { ParticipantNotFoundError } = await import("@better-conversation/errors");
      throw new ParticipantNotFoundError(conversationId, chatterId);
    }
    await this.engine.participants.update(participant.id, { lastReadAt: new Date() });
  }

  async setTyping(conversationId: string, chatterId: string, until: Date): Promise<void> {
    const participant = await this.engine.participants.find(conversationId, chatterId);
    if (!participant) {
      const { ParticipantNotFoundError } = await import("@better-conversation/errors");
      throw new ParticipantNotFoundError(conversationId, chatterId);
    }
    await this.engine.participants.update(participant.id, { typingUntil: until });
  }

  async getPresence(conversationId: string): Promise<PresenceInfo[]> {
    const participants = await this.engine.participants.list(conversationId);
    const now = new Date();
    return participants
      .filter((p) => !p.leftAt)
      .map((p) => ({
        chatterId: p.chatterId,
        lastReadAt: p.lastReadAt ?? null,
        lastSeenAt: p.lastSeenAt ?? null,
        typingUntil: p.typingUntil && new Date(p.typingUntil) > now ? p.typingUntil : null,
      }));
  }
}
