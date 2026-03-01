export interface Participant {
  id: string;
  conversationId: string;
  chatterId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  lastReadAt: Date | null;
  metadata: Record<string, unknown> | null;
}

export interface ParticipantInput {
  conversationId: string;
  chatterId: string;
  role: string;
}
