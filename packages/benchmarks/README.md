# @better-conversation/benchmarks

Benchmarks and stress tests for better-conversation using **SQLite** and **adapter-drizzle**.

## Usage

From `packages/benchmarks`:

```bash
# Run benchmarks (migrates schema if needed, then runs)
bun run bench

# Run stress tests (50 runs × 6 tests, concurrent, in-memory DB)
bun run stress

# Apply schema via drizzle-kit (optional; migrate runs automatically for bench)
bun run db:push

# Generate new migrations after schema changes
bun run db:generate
```

From repo root:

```bash
bun run bench --filter=@better-conversation/benchmarks
# or
cd packages/benchmarks && bun run bench
cd packages/benchmarks && bun run stress
```

## Environment

- `BENCH_DB`: SQLite file path (default: `./benchmarks.db` in package dir)

## Benchmarks

| Operation | Description |
|-----------|-------------|
| chatters.create | Create + update chatter |
| chatters.find | Find chatter by id |
| chatters.findByEntity | Find chatter by entity |
| chatters.update | Update chatter |
| conversations.create | Create conv + add participant |
| conversations.find | Find conv by id |
| conversations.list | List conversations |
| conversations.update | Update conv |
| participants.add | Add participant |
| participants.list | List participants |
| blocks.list | List blocks |
| blocks.send | Send block |
| policies.resolve | Resolve policy for chatter/conv |
| permissions.check | Check permission |

## Stress Tests

Uses `bun test --rerun-each 50 --concurrent --max-concurrency 20` to run each test 50 times concurrently, exercising chatters, conversations, participants, blocks, policies, and permissions under load.
