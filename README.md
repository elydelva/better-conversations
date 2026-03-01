# better-conversation

A **headless, pure TypeScript** messaging engine. It exposes interfaces; you provide the implementations. Same philosophy as better-auth — but for conversations.

## Install

```bash
bun add @better-conversation/core
```

## Usage

```ts
import { version } from "@better-conversation/core";
console.log(version);
```

## Packages

| Package | Description |
|---------|-------------|
| `@better-conversation/core` | Engine, interfaces, hooks, built-in audit |
| `@better-conversation/client` | Type-safe browser SDK |
| `@better-conversation/adapter-drizzle` | PostgreSQL via Drizzle ORM |
| `@better-conversation/adapter-prisma` | Placeholder |
| `@better-conversation/adapter-mongodb` | Placeholder |
| `@better-conversation/handler-next` | Next.js App Router |
| `@better-conversation/handler-hono` | Placeholder |
| `@better-conversation/handler-express` | Placeholder |
| `@better-conversation/blocks` | media, reaction, embed, poll |
| `@better-conversation/roles` | moderator, admin, guest, support |
| `@better-conversation/plugin-sse` | Real-time block updates |
| `@better-conversation/plugin-presence` | Mark-read, typing, last-seen |
| `@better-conversation/plugin-rate-limit` | Rate limit blocks per chatter |

## Development

```bash
bun install
bun run test
bun run lint
bun run typecheck
```

## License

MIT — see [LICENSE](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
