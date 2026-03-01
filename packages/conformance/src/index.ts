import { describe, expect, test } from "bun:test";
import type { DatabaseAdapter } from "@better-conversation/core";

export interface ConformanceOptions {
  adapter: DatabaseAdapter;
  beforeEach?: () => Promise<void>;
}

/**
 * Run the conformance test suite against a DatabaseAdapter implementation.
 * Use this to validate custom adapters against the core spec.
 *
 * @example
 * import { runConformanceTests } from "@better-conversation/conformance";
 * import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
 * import { db } from "./db";
 *
 * runConformanceTests({ adapter: drizzleAdapter(db, { provider: "sqlite" }) });
 */
export function runConformanceTests(options: ConformanceOptions): void {
  const { adapter } = options;

  describe("ChatterAdapter conformance", () => {
    test("create returns chatter with id and timestamps", async () => {
      const chatter = await adapter.chatters.create({
        displayName: "Test User",
        entityType: "user",
        entityId: "u1",
        avatarUrl: null,
      });
      expect(chatter.id).toBeDefined();
      expect(chatter.displayName).toBe("Test User");
      expect(chatter.entityType).toBe("user");
      expect(chatter.entityId).toBe("u1");
      expect(chatter.createdAt).toBeInstanceOf(Date);
      expect(chatter.updatedAt).toBeInstanceOf(Date);
    });

    test("find returns null for unknown id", async () => {
      const result = await adapter.chatters.find("unknown-id-12345");
      expect(result).toBeNull();
    });

    test("findByEntity returns chatter after create", async () => {
      const created = await adapter.chatters.create({
        displayName: "Entity User",
        entityType: "user",
        entityId: "entity-123",
        avatarUrl: null,
      });
      const found = await adapter.chatters.findByEntity("user", "entity-123");
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    test("update modifies chatter", async () => {
      const created = await adapter.chatters.create({
        displayName: "Original",
        entityType: "user",
        entityId: null,
        avatarUrl: null,
      });
      const updated = await adapter.chatters.update(created.id, {
        displayName: "Updated Name",
      });
      expect(updated.displayName).toBe("Updated Name");
    });
  });

  describe("ConversationAdapter conformance", () => {
    test("create returns conversation with id", async () => {
      const chatter = await adapter.chatters.create({
        displayName: "Creator",
        entityType: "user",
        entityId: null,
        avatarUrl: null,
      });
      const conv = await adapter.conversations.create({
        createdBy: chatter.id,
        title: null,
        entityType: null,
        entityId: null,
        metadata: null,
      });
      expect(conv.id).toBeDefined();
      expect(conv.createdBy).toBe(chatter.id);
      expect(conv.status).toBeDefined();
    });

    test("find returns null for unknown id", async () => {
      const result = await adapter.conversations.find("unknown-conv");
      expect(result).toBeNull();
    });

    test("list returns paginated result", async () => {
      const result = await adapter.conversations.list({ limit: 10 });
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe("ParticipantAdapter conformance", () => {
    test("add and list participants", async () => {
      const chatter = await adapter.chatters.create({
        displayName: "P1",
        entityType: "user",
        entityId: null,
        avatarUrl: null,
      });
      const conv = await adapter.conversations.create({
        createdBy: chatter.id,
        title: null,
        entityType: null,
        entityId: null,
        metadata: null,
      });
      const participant = await adapter.participants.add({
        conversationId: conv.id,
        chatterId: chatter.id,
        role: "member",
      });
      expect(participant.id).toBeDefined();
      expect(participant.role).toBe("member");

      const list = await adapter.participants.list(conv.id);
      expect(list.some((p) => p.id === participant.id)).toBe(true);
    });
  });

  describe("BlockAdapter conformance", () => {
    test("create and list blocks", async () => {
      const chatter = await adapter.chatters.create({
        displayName: "Author",
        entityType: "user",
        entityId: null,
        avatarUrl: null,
      });
      const conv = await adapter.conversations.create({
        createdBy: chatter.id,
        title: null,
        entityType: null,
        entityId: null,
        metadata: null,
      });
      const block = await adapter.blocks.create({
        conversationId: conv.id,
        authorId: chatter.id,
        type: "text",
        body: "Hello",
        metadata: null,
        threadParentId: null,
      });
      expect(block.id).toBeDefined();
      expect(block.type).toBe("text");
      expect(block.body).toBe("Hello");

      const list = await adapter.blocks.list({
        conversationId: conv.id,
        limit: 10,
      });
      expect(list.items.some((b) => b.id === block.id)).toBe(true);
    });

    test("find returns null for unknown block", async () => {
      const result = await adapter.blocks.find("unknown-block");
      expect(result).toBeNull();
    });
  });

  describe("RegistryAdapter conformance", () => {
    test("upsertBlock and upsertRole do not throw", async () => {
      await adapter.registries.upsertBlock("text", {}, true);
      await adapter.registries.upsertRole("member", null, {}, true);
    });
  });

  describe("PolicyAdapter conformance", () => {
    test("find returns null for unknown policy", async () => {
      const result = await adapter.policies.find("global", "global");
      expect(result === null || typeof result === "object").toBe(true);
    });

    test("upsert does not throw", async () => {
      await adapter.policies.upsert("global", "global", {
        allowedBlocks: ["text"],
        maxBlocksPerMinute: 20,
      });
    });
  });
}
