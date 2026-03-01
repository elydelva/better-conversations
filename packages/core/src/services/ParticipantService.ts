import type { ParticipantAdapter } from "../adapter/index.js";
import type { Participant, ParticipantInput } from "../types/index.js";

export class ParticipantService {
  constructor(private readonly participants: ParticipantAdapter) {}

  async list(conversationId: string): Promise<Participant[]> {
    return this.participants.list(conversationId);
  }

  async find(conversationId: string, chatterId: string): Promise<Participant | null> {
    return this.participants.find(conversationId, chatterId);
  }

  async add(data: ParticipantInput): Promise<Participant> {
    return this.participants.add(data);
  }

  async remove(id: string): Promise<void> {
    return this.participants.remove(id);
  }

  async update(id: string, data: Partial<Participant>): Promise<Participant> {
    return this.participants.update(id, data);
  }

  async setRole(conversationId: string, chatterId: string, role: string): Promise<Participant> {
    const participant = await this.participants.find(conversationId, chatterId);
    if (!participant) {
      throw new Error(
        `Participant not found: chatter ${chatterId} in conversation ${conversationId}`
      );
    }
    return this.participants.update(participant.id, { role });
  }

  async markRead(conversationId: string, chatterId: string): Promise<Participant> {
    const participant = await this.participants.find(conversationId, chatterId);
    if (!participant) {
      throw new Error(
        `Participant not found: chatter ${chatterId} in conversation ${conversationId}`
      );
    }
    return this.participants.update(participant.id, { lastReadAt: new Date() });
  }
}
