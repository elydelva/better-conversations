# prisma-nextjs

Next.js + Prisma (Postgres) + handler-next.

## Setup

```bash
docker compose up -d
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5433/better_conv" > .env
bun install
bun run db:push
```

## Run

```bash
bun run dev
```

Open http://localhost:3003

## Verify

```bash
curl http://localhost:3003/api/conversations
```
