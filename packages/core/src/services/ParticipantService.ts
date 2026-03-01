import {
  ParticipantAlreadyJoinedError,
  ParticipantNotFoundError,
  ParticipantValidationError,
} from "@better-conversation/errors";
import type { ParticipantAdapter } from "../adapter/index.js";
import type { RoleRegistry } from "../registry/index.js";
import type { Participant, ParticipantInput } from "../types/index.js";

export interface ParticipantServiceConfig {
  participants: ParticipantAdapter;
  roleRegistry?: RoleRegistry;
}

export class ParticipantService {
  constructor(private readonly config: ParticipantAdapter | ParticipantServiceConfig) {
    this._participants =
      "participants" in config ? config.participants : (config as ParticipantAdapter);
    this._roleRegistry = "roleRegistry" in config ? config.roleRegistry : undefined;
  }

  private readonly _participants: ParticipantAdapter;
  private readonly _roleRegistry?: RoleRegistry;

  private get participants() {
    return this._participants;
  }

  async list(conversationId: string): Promise<Participant[]> {
    return this.participants.list(conversationId);
  }

  async find(conversationId: string, chatterId: string): Promise<Participant | null> {
    return this.participants.find(conversationId, chatterId);
  }

  async add(data: ParticipantInput): Promise<Participant> {
    const existing = await this.participants.find(data.conversationId, data.chatterId);
    if (existing && !existing.leftAt) {
      throw new ParticipantAlreadyJoinedError(data.conversationId, data.chatterId);
    }
    return this.participants.add(data);
  }

  async remove(id: string): Promise<void> {
    return this.participants.remove(id);
  }

  async update(id: string, data: Partial<Participant>): Promise<Participant> {
    return this.participants.update(id, data);
  }

  async setRole(conversationId: string, chatterId: string, role: string): Promise<Participant> {
    if (this._roleRegistry && !(role in this._roleRegistry)) {
      throw new ParticipantValidationError(`Role "${role}" is not registered`);
    }
    const participant = await this.participants.find(conversationId, chatterId);
    if (!participant) {
      throw new ParticipantNotFoundError(conversationId, chatterId);
    }
    return this.participants.update(participant.id, { role });
  }
}
