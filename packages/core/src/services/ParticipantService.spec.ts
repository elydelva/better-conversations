import { describe, expect, test } from "bun:test";
import {
  ParticipantAlreadyJoinedError,
  ParticipantNotFoundError,
  ParticipantValidationError,
} from "@better-conversation/errors";
import { createMockAdapter, createMockParticipant } from "../fixtures/index.js";
import { ParticipantService } from "./ParticipantService.js";

describe("ParticipantService", () => {
  test("add throws ParticipantAlreadyJoinedError when find returns active participant", async () => {
    const activeParticipant = createMockParticipant({ leftAt: null });
    const participants = {
      find: async () => activeParticipant,
      add: async () => createMockParticipant(),
      update: async () => createMockParticipant(),
      remove: async () => {},
      list: async () => [],
    };
    const adapter = createMockAdapter({ participants });
    const service = new ParticipantService(adapter.participants);

    await expect(
      service.add({
        conversationId: "conv_1",
        chatterId: "chatter_1",
        role: "member",
      })
    ).rejects.toThrow(ParticipantAlreadyJoinedError);
  });

  test("add succeeds when find returns null", async () => {
    const addedParticipant = createMockParticipant({ id: "part_new" });
    const participants = {
      find: async () => null,
      add: async () => addedParticipant,
      update: async () => createMockParticipant(),
      remove: async () => {},
      list: async () => [],
    };
    const adapter = createMockAdapter({ participants });
    const service = new ParticipantService(adapter.participants);

    const result = await service.add({
      conversationId: "conv_1",
      chatterId: "chatter_1",
      role: "member",
    });
    expect(result.id).toBe("part_new");
  });

  test("add succeeds when find returns participant with leftAt set", async () => {
    const leftParticipant = createMockParticipant({ leftAt: new Date() });
    const rejoinParticipant = createMockParticipant({ id: "part_rejoin" });
    const participants = {
      find: async () => leftParticipant,
      add: async () => rejoinParticipant,
      update: async () => createMockParticipant(),
      remove: async () => {},
      list: async () => [],
    };
    const adapter = createMockAdapter({ participants });
    const service = new ParticipantService(adapter.participants);

    const result = await service.add({
      conversationId: "conv_1",
      chatterId: "chatter_1",
      role: "member",
    });
    expect(result.id).toBe("part_rejoin");
  });

  test("setRole throws ParticipantNotFoundError when not found", async () => {
    const participants = {
      find: async () => null,
      add: async () => createMockParticipant(),
      update: async () => createMockParticipant(),
      remove: async () => {},
      list: async () => [],
    };
    const adapter = createMockAdapter({ participants });
    const service = new ParticipantService(adapter.participants);

    await expect(service.setRole("conv_1", "chatter_missing", "member")).rejects.toThrow(
      ParticipantNotFoundError
    );
  });

  test("setRole throws ParticipantValidationError when role not in registry", async () => {
    const participants = {
      find: async () => createMockParticipant(),
      add: async () => createMockParticipant(),
      update: async () => createMockParticipant(),
      remove: async () => {},
      list: async () => [],
    };
    const service = new ParticipantService({
      participants,
      roleRegistry: { member: { name: "member", policy: {} } },
    });

    await expect(service.setRole("conv_1", "chatter_1", "superadmin")).rejects.toThrow(
      ParticipantValidationError
    );
  });

  test("markRead throws ParticipantNotFoundError when not found", async () => {
    const participants = {
      find: async () => null,
      add: async () => createMockParticipant(),
      update: async () => createMockParticipant(),
      remove: async () => {},
      list: async () => [],
    };
    const adapter = createMockAdapter({ participants });
    const service = new ParticipantService(adapter.participants);

    await expect(service.markRead("conv_1", "chatter_missing")).rejects.toThrow(
      ParticipantNotFoundError
    );
  });
});
