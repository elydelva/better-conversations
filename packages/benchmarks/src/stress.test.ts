/**
 * Stress tests (throughput benchmarks) for better-conversation.
 * Run with: bun run stress
 *
 * Measures max operations per second for each component.
 * Uses in-memory SQLite + adapter-drizzle.
 */

import { Database } from "bun:sqlite";
import { beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { betterConversation } from "@better-conversation/core";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

let engine: ReturnType<typeof betterConversation>;
let chatter: { id: string };
let conv: { id: string };

const DURATION_MS = 2000;

async function measureOpsPerSecond(
  name: string,
  fn: () => Promise<void>,
  warmupRuns = 5
): Promise<{ ops: number; opsPerSec: number }> {
  for (let i = 0; i < warmupRuns; i++) await fn();
  const start = performance.now();
  let count = 0;
  while (performance.now() - start < DURATION_MS) {
    await fn();
    count++;
  }
  const elapsed = (performance.now() - start) / 1000;
  const opsPerSec = count / elapsed;
  console.log(
    `  ${name}: ${count.toLocaleString()} ops in ${elapsed.toFixed(2)}s → ${opsPerSec.toFixed(0)} ops/sec`
  );
  return { ops: count, opsPerSec };
}

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

  chatter = await engine.chatters.create({
    displayName: "Stress",
    entityType: "user",
    entityId: "stress-user",
    avatarUrl: null,
  });
  conv = await engine.conversations.create({
    createdBy: chatter.id,
    title: "Stress Conv",
    entityType: null,
    entityId: null,
    metadata: null,
  });
  await engine.participants.add({
    conversationId: conv.id,
    chatterId: chatter.id,
    role: "member",
  });
});

test("stress: chatters.create ops/sec", async () => {
  let i = 0;
  const result = await measureOpsPerSecond("chatters.create", async () => {
    const c = await engine.chatters.create({
      displayName: `Stress ${i++}`,
      entityType: "user",
      entityId: `e-${i}`,
      avatarUrl: null,
    });
    expect(c.id).toBeDefined();
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: chatters.find ops/sec", async () => {
  const result = await measureOpsPerSecond("chatters.find", async () => {
    const found = await engine.chatters.find(chatter.id);
    expect(found?.id).toBe(chatter.id);
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: chatters.findByEntity ops/sec", async () => {
  const result = await measureOpsPerSecond("chatters.findByEntity", async () => {
    const found = await engine.chatters.findByEntity("user", "stress-user");
    expect(found?.id).toBe(chatter.id);
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: chatters.update ops/sec", async () => {
  const result = await measureOpsPerSecond("chatters.update", async () => {
    await engine.chatters.update(chatter.id, {
      displayName: `Updated ${Date.now()}`,
    });
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: conversations.create ops/sec", async () => {
  let i = 0;
  const result = await measureOpsPerSecond("conversations.create", async () => {
    const c = await engine.conversations.create({
      createdBy: chatter.id,
      title: `Conv ${i++}`,
      entityType: null,
      entityId: null,
      metadata: null,
    });
    await engine.participants.add({
      conversationId: c.id,
      chatterId: chatter.id,
      role: "member",
    });
    expect(c.id).toBeDefined();
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: conversations.find ops/sec", async () => {
  const result = await measureOpsPerSecond("conversations.find", async () => {
    const found = await engine.conversations.find(conv.id);
    expect(found?.id).toBe(conv.id);
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: conversations.list ops/sec", async () => {
  const result = await measureOpsPerSecond("conversations.list", async () => {
    const list = await engine.conversations.list({ limit: 20 });
    expect(Array.isArray(list.items)).toBe(true);
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: participants.add ops/sec", async () => {
  let i = 0;
  const result = await measureOpsPerSecond("participants.add", async () => {
    const c = await engine.conversations.create({
      createdBy: chatter.id,
      title: null,
      entityType: null,
      entityId: null,
      metadata: null,
    });
    const p = await engine.participants.add({
      conversationId: c.id,
      chatterId: chatter.id,
      role: "member",
    });
    expect(p.id).toBeDefined();
    i++;
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: participants.list ops/sec", async () => {
  const result = await measureOpsPerSecond("participants.list", async () => {
    const list = await engine.participants.list(conv.id);
    expect(Array.isArray(list)).toBe(true);
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: blocks.send ops/sec", async () => {
  const result = await measureOpsPerSecond("blocks.send", async () => {
    const block = await engine.blocks.send({
      conversationId: conv.id,
      authorId: chatter.id,
      type: "text",
      body: `msg ${Date.now()}`,
      metadata: null,
      threadParentId: null,
    });
    expect(block.id).toBeDefined();
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: blocks.list ops/sec", async () => {
  const result = await measureOpsPerSecond("blocks.list", async () => {
    const list = await engine.blocks.list({
      conversationId: conv.id,
      limit: 50,
    });
    expect(Array.isArray(list.items)).toBe(true);
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: policies.resolve ops/sec", async () => {
  const result = await measureOpsPerSecond("policies.resolve", async () => {
    const resolved = await engine.policies.resolve(chatter.id, conv.id);
    expect(resolved).toBeDefined();
    expect(typeof resolved.maxBlocksPerMinute).toBe("number");
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});

test("stress: permissions.check ops/sec", async () => {
  const result = await measureOpsPerSecond("permissions.check", async () => {
    const ok = await engine.permissions.check(chatter.id, "send", "global");
    expect(typeof ok).toBe("boolean");
  });
  expect(result.opsPerSec).toBeGreaterThan(0);
});
