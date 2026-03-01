import type { Participant, ParticipantInput } from "../types/index.js";

export interface ParticipantAdapter {
  list(conversationId: string): Promise<Participant[]>;
  find(conversationId: string, chatterId: string): Promise<Participant | null>;
  add(data: ParticipantInput): Promise<Participant>;
  update(id: string, data: Partial<Participant>): Promise<Participant>;
  remove(id: string): Promise<void>;
}
