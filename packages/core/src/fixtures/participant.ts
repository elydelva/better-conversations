import type { Participant } from "../types/index.js";

export function createMockParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: "part_1",
    conversationId: "conv_1",
    chatterId: "chatter_1",
    role: "member",
    joinedAt: new Date(),
    leftAt: null,
    lastReadAt: null,
    metadata: null,
    ...overrides,
  };
}
