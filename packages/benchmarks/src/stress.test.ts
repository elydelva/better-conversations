/**
 * Stress tests for better-conversation.
 * Run with: bun run stress
 *
 * Uses bun test --rerun-each 50 --concurrent to hammer all components
 * with real SQLite + adapter-drizzle. Uses in-memory DB for a fresh schema each run.
 */

import { Database } from "bun:sqlite";
import { beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { betterConversation } from "@better-conversation/core";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

let engine: ReturnType<typeof betterConversation>;

beforeAll(async () => {
  const db = drizzle(new Database(":memory:", { create: true }));
  migrate(db, {
    migrationsFolder: join(import.meta.dir, "..", "drizzle"),
  });
  engine = betterConversation({
    adapter: drizzleAdapter(db, { provider: "sqlite" }),
    policies: {
      global: {
        sendCooldownMs: 0,
        maxBlocksPerMinute: 999999,
        maxBlocksPerHour: 999999,
        maxBlocksPerDay: 999999,
      },
      onResolve: (resolved) => {
        resolved.sendCooldownMs = 0;
        resolved.maxBlocksPerMinute = 999999;
        resolved.maxBlocksPerHour = 999999;
        resolved.maxBlocksPerDay = 999999;
        return resolved;
      },
    },
  });
  await engine.init();
});

test("stress: chatters create/find/update", async () => {
  const id = `stress-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const created = await engine.chatters.create({
    displayName: `Stress ${id}`,
    entityType: "user",
    entityId: id,
    avatarUrl: null,
  });
  expect(created.id).toBeDefined();
  const found = await engine.chatters.find(created.id);
  expect(found?.displayName).toBe(`Stress ${id}`);
  const byEntity = await engine.chatters.findByEntity("user", id);
  expect(byEntity?.id).toBe(created.id);
  await engine.chatters.update(created.id, { displayName: `Updated ${id}` });
});

test("stress: conversations create/list/find", async () => {
  const chatter = await engine.chatters.create({
    displayName: "Stress Creator",
    entityType: "user",
    entityId: `creator-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    avatarUrl: null,
  });
  const conv = await engine.conversations.create({
    createdBy: chatter.id,
    title: `Stress Conv ${Date.now()}`,
    entityType: null,
    entityId: null,
    metadata: null,
  });
  expect(conv.id).toBeDefined();
  const found = await engine.conversations.find(conv.id);
  expect(found?.createdBy).toBe(chatter.id);
  const list = await engine.conversations.list({ limit: 5 });
  expect(list.items.length).toBeGreaterThanOrEqual(1);
});

test("stress: participants add/list", async () => {
  const chatter = await engine.chatters.create({
    displayName: "P",
    entityType: "user",
    entityId: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    avatarUrl: null,
  });
  const conv = await engine.conversations.create({
    createdBy: chatter.id,
    title: null,
    entityType: null,
    entityId: null,
    metadata: null,
  });
  const participant = await engine.participants.add({
    conversationId: conv.id,
    chatterId: chatter.id,
    role: "member",
  });
  expect(participant.id).toBeDefined();
  const list = await engine.participants.list(conv.id);
  expect(list.some((p) => p.id === participant.id)).toBe(true);
});

test("stress: blocks send/list", async () => {
  const chatter = await engine.chatters.create({
    displayName: "Block Author",
    entityType: "user",
    entityId: `author-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    avatarUrl: null,
  });
  const conv = await engine.conversations.create({
    createdBy: chatter.id,
    title: null,
    entityType: null,
    entityId: null,
    metadata: null,
  });
  await engine.participants.add({
    conversationId: conv.id,
    chatterId: chatter.id,
    role: "member",
  });
  const block = await engine.blocks.send({
    conversationId: conv.id,
    authorId: chatter.id,
    type: "text",
    body: `Stress msg ${Date.now()}`,
    metadata: null,
    threadParentId: null,
  });
  expect(block.id).toBeDefined();
  const list = await engine.blocks.list({ conversationId: conv.id, limit: 10 });
  expect(list.items.some((b) => b.id === block.id)).toBe(true);
});

test("stress: policies.resolve", async () => {
  const chatter = await engine.chatters.create({
    displayName: "Policy",
    entityType: "user",
    entityId: `pol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    avatarUrl: null,
  });
  const conv = await engine.conversations.create({
    createdBy: chatter.id,
    title: null,
    entityType: null,
    entityId: null,
    metadata: null,
  });
  await engine.participants.add({
    conversationId: conv.id,
    chatterId: chatter.id,
    role: "member",
  });
  const resolved = await engine.policies.resolve(chatter.id, conv.id);
  expect(resolved).toBeDefined();
  expect(typeof resolved.maxBlocksPerMinute).toBe("number");
});

test("stress: permissions.check", async () => {
  const chatter = await engine.chatters.create({
    displayName: "Perm",
    entityType: "user",
    entityId: `perm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    avatarUrl: null,
  });
  const result = await engine.permissions.check(chatter.id, "send", "global");
  expect(typeof result).toBe("boolean");
});
