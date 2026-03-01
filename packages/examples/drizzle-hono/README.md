# drizzle-hono

Hono + Drizzle (SQLite) + handler-hono. No Docker required.

## Setup

```bash
bun install
bun run db:push
```

## Run

```bash
bun run dev
```

## Verify

```bash
# Create chatter
curl -X POST http://localhost:3002/api/chatters \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test","entityType":"user","entityId":"u1"}'

# List conversations
curl http://localhost:3002/api/conversations
```
