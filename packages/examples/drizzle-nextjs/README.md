# drizzle-nextjs

Next.js App Router + Drizzle (SQLite) + handler-next. No Docker required.

## Setup

```bash
bun install
bun run db:push
```

## Run

```bash
bun run dev
```

Open http://localhost:3000

## Verify

- UI: Creates a chatter, conversation, lists conversations
- curl: `curl http://localhost:3000/api/conversations`
