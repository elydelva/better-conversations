# drizzle-express

Express + Drizzle (Postgres) + handler-express.

## Setup

```bash
docker compose up -d
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
curl -X POST http://localhost:3001/api/chatters \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test","entityType":"user","entityId":"u1"}'

# List conversations
curl http://localhost:3001/api/conversations
```
