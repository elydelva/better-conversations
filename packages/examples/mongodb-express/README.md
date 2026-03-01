# mongodb-express

Express + adapter-mongodb (stub) + handler-express.

**Note:** `@better-conversation/adapter-mongodb` is currently a stub. The server runs and the handler is wired, but all DB operations return errors until the adapter is implemented.

## Setup

```bash
docker compose up -d  # optional, for when adapter is implemented
bun install
```

## Run

```bash
bun run dev
```

## Verify

```bash
# Server responds; DB operations return 500 (adapter not implemented)
curl http://localhost:3004/api/conversations
```
