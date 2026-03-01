import { describe, expect, test } from "bun:test";
import { ConversationArchivedError, ConversationNotFoundError } from "@better-conversation/errors";
import { createMockAdapter, createMockConversation } from "../fixtures/index.js";
import { ConversationService } from "./ConversationService.js";

describe("ConversationService", () => {
  test("update throws ConversationNotFoundError when not found", async () => {
    const conversations = {
      find: async () => null,
      findByEntity: async () => [],
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockConversation(),
      update: async () => createMockConversation(),
    };
    const adapter = createMockAdapter({ conversations });
    const service = new ConversationService(adapter.conversations);

    await expect(service.update("nonexistent", { title: "Updated" })).rejects.toThrow(
      ConversationNotFoundError
    );
  });

  test("update throws ConversationArchivedError when conversation is archived", async () => {
    const archived = createMockConversation({ status: "archived" });
    const conversations = {
      find: async () => archived,
      findByEntity: async () => [],
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockConversation(),
      update: async () => createMockConversation(),
    };
    const adapter = createMockAdapter({ conversations });
    const service = new ConversationService(adapter.conversations);

    await expect(service.update("conv_1", { title: "Updated" })).rejects.toThrow(
      ConversationArchivedError
    );
  });

  test("archive throws when not found", async () => {
    const conversations = {
      find: async () => null,
      findByEntity: async () => [],
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockConversation(),
      update: async () => createMockConversation(),
    };
    const adapter = createMockAdapter({ conversations });
    const service = new ConversationService(adapter.conversations);

    await expect(service.archive("nonexistent")).rejects.toThrow(ConversationNotFoundError);
  });

  test("archive throws when already archived", async () => {
    const archived = createMockConversation({ status: "archived" });
    const conversations = {
      find: async () => archived,
      findByEntity: async () => [],
      list: async () => ({ items: [], total: 0, hasMore: false }),
      create: async () => createMockConversation(),
      update: async () => createMockConversation(),
    };
    const adapter = createMockAdapter({ conversations });
    const service = new ConversationService(adapter.conversations);

    await expect(service.archive("conv_1")).rejects.toThrow(ConversationArchivedError);
  });
});
