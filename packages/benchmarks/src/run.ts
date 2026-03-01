/**
 * Official benchmarks for better-conversation.
 * Run with: bun run bench
 *
 * Uses SQLite + adapter-drizzle for realistic I/O.
 * Benchmarks: chatters, conversations, participants, blocks, policies, permissions.
 */

import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { betterConversation } from "@better-conversation/core";
import { db } from "./db.js";

const adapter = drizzleAdapter(db, { provider: "sqlite" });
const engine = betterConversation({
  adapter,
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

// Seed data
const chatter = await engine.chatters.create({
  displayName: "Bench User",
  entityType: "user",
  entityId: null,
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

// Extra chatters and conversations for list/findByEntity benchmarks
const chatters = [chatter];
for (let i = 0; i < 20; i++) {
  const c = await engine.chatters.create({
    displayName: `User ${i}`,
    entityType: "user",
    entityId: `e-${i}`,
    avatarUrl: null,
  });
  chatters.push(c);
}
const convs = [conv];
for (let i = 0; i < 15; i++) {
  const c = await engine.conversations.create({
    createdBy: chatter.id,
    title: `Conv ${i}`,
    entityType: null,
    entityId: null,
    metadata: null,
  });
  convs.push(c);
  await engine.participants.add({
    conversationId: c.id,
    chatterId: chatter.id,
    role: "member",
  });
}

// Seed blocks
for (let i = 0; i < 50; i++) {
  await engine.blocks.send({
    conversationId: conv.id,
    authorId: chatter.id,
    type: "text",
    body: `msg ${i}`,
    metadata: null,
    threadParentId: null,
  });
}

function bench(name: string, fn: () => Promise<void>, iterations: number) {
  const start = performance.now();
  return (async () => {
    for (let i = 0; i < iterations; i++) await fn();
    const elapsed = performance.now() - start;
    const perOp = (elapsed / iterations).toFixed(3);
    console.log(`${name}: ${iterations} iterations, ${elapsed.toFixed(0)}ms total, ${perOp}ms/op`);
  })();
}

console.log("\n--- better-conversation benchmarks (SQLite + adapter-drizzle) ---\n");

// Chatters
await bench(
  "chatters.create",
  async () => {
    const c = await engine.chatters.create({
      displayName: "Temp",
      entityType: "user",
      entityId: null,
      avatarUrl: null,
    });
    await engine.chatters.update(c.id, { displayName: "Updated" });
  },
  50
);

await bench(
  "chatters.find",
  async () => {
    await engine.chatters.find(chatter.id);
  },
  200
);

await bench(
  "chatters.findByEntity",
  async () => {
    await engine.chatters.findByEntity("user", "e-5");
  },
  100
);

await bench(
  "chatters.update",
  async () => {
    await engine.chatters.update(chatter.id, { displayName: "Bench User" });
  },
  100
);

// Conversations
await bench(
  "conversations.create",
  async () => {
    const c = await engine.conversations.create({
      createdBy: chatter.id,
      title: "Bench",
      entityType: null,
      entityId: null,
      metadata: null,
    });
    await engine.participants.add({
      conversationId: c.id,
      chatterId: chatter.id,
      role: "member",
    });
  },
  30
);

await bench(
  "conversations.find",
  async () => {
    await engine.conversations.find(conv.id);
  },
  200
);

await bench(
  "conversations.list",
  async () => {
    await engine.conversations.list({ limit: 20 });
  },
  100
);

await bench(
  "conversations.update",
  async () => {
    await engine.conversations.update(conv.id, { title: "Updated" });
  },
  50
);

// Participants
await bench(
  "participants.add",
  async () => {
    const c2 = await engine.conversations.create({
      createdBy: chatter.id,
      title: null,
      entityType: null,
      entityId: null,
      metadata: null,
    });
    await engine.participants.add({
      conversationId: c2.id,
      chatterId: chatters[1].id,
      role: "member",
    });
  },
  30
);

await bench(
  "participants.list",
  async () => {
    await engine.participants.list(conv.id);
  },
  150
);

// Blocks
await bench(
  "blocks.list (limit 50)",
  async () => {
    await engine.blocks.list({ conversationId: conv.id, limit: 50 });
  },
  100
);

await bench(
  "blocks.send",
  async () => {
    await engine.blocks.send({
      conversationId: conv.id,
      authorId: chatter.id,
      type: "text",
      body: "bench",
      metadata: null,
      threadParentId: null,
    });
  },
  80
);

// Policies
await bench(
  "policies.resolve",
  async () => {
    await engine.policies.resolve(chatter.id, conv.id);
  },
  200
);

// Permissions
await bench(
  "permissions.check",
  async () => {
    await engine.permissions.check(chatter.id, "send", conv.id);
  },
  150
);

console.log("\nDone.\n");
