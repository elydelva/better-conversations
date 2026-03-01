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
| `@better-conversation/core` | Pure engine, interfaces, pipeline hooks |
| `@better-conversation/client` | Type-safe browser SDK |
| `@better-conversation/adapters` | Drizzle, Prisma, MongoDB |
| `@better-conversation/handlers` | Hono, Express, Next.js |
| `@better-conversation/blocks` | media, reaction, embed, poll |
| `@better-conversation/roles` | moderator, admin, guest, support |
| `@better-conversation/plugins` | SSE, audit, rate-limit |

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
