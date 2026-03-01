# Agent Guide — better-conversation

This file provides context for AI assistants working on this codebase.

## Project Overview

**better-conversation** is a headless, pure TypeScript messaging engine. It exposes interfaces; consumers provide implementations. Same philosophy as better-auth — but for conversations (chatters, typed blocks, threads, pipeline hooks, permissions, policies).

- **Core**: Pure engine, zero external dependencies, no framework/ORM imports
- **Runtime support**: Node, Bun, Deno, Edge, workers
- **Architecture**: Clean Architecture — core defines interfaces, adapters implement them

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Bun** | Runtime, package manager, tests |
| **TypeScript** | Strict mode, `moduleResolution: "bundler"` |
| **Biome** | Lint + format (no ESLint/Prettier) |
| **bun test** | Testing (not Vitest nor Jest) |
| **Changesets** | Version management and releases |
| **Bun Catalogs** | Shared dependency versions via `catalog:` |

## Repository Structure

```
packages/
├── core/           # @better-conversation/core — engine, interfaces, zero deps
├── errors/        # @better-conversation/errors — ConversationError, domain errors
├── client/         # @better-conversation/client — browser SDK
├── adapter-drizzle/   # @better-conversation/adapter-drizzle — PostgreSQL
├── adapter-prisma/    # @better-conversation/adapter-prisma — placeholder
├── adapter-mongodb/   # @better-conversation/adapter-mongodb — placeholder
├── handler-next/      # @better-conversation/handler-next — Next.js
├── handler-hono/      # @better-conversation/handler-hono — Hono
├── handler-express/   # @better-conversation/handler-express — Express
├── blocks/           # @better-conversation/blocks — media, reaction, embed, poll
├── roles/            # @better-conversation/roles — moderator, admin, guest, support
├── plugin-sse/       # @better-conversation/plugin-sse — real-time block updates
├── plugin-presence/  # @better-conversation/plugin-presence — mark-read, typing
├── plugin-rate-limit/# @better-conversation/plugin-rate-limit — rate limiting
└── plugin-history/   # @better-conversation/plugin-history — block edit history
```

**Package convention**: One package per adapter and per handler for dependency independence. Example:

```ts
import { drizzleAdapter } from "@better-conversation/adapter-drizzle";
import { createNextHandler } from "@better-conversation/handler-next";
import { moderatorRole } from "@better-conversation/roles/moderator";
```

## Commands

```bash
bun install          # Install deps (uses Bun catalogs)
bun run test         # Run tests (bun test)
bun run lint         # Biome lint
bun run format       # Biome format
bun run check        # Lint + format + organize imports
bun run typecheck    # tsc --noEmit
bun run build        # Build all packages
bun run changeset    # Add a changeset
```

## Golden Rules

1. **Core purity**: `packages/core` must never import any framework, ORM, or Node-specific runtime. Only interfaces.
2. **Bun over Node**: Use `bun` for running, testing, installing. Use `bun test`, not Vitest.
3. **Biome over ESLint/Prettier**: Format and lint with Biome only.
4. **English**: All project documentation and user-facing text in English.
5. **No type suppression**: Never use `as any`, `@ts-ignore`, or `@ts-expect-error` unless absolutely required and justified.
6. **Workspace deps**: Use `workspace:*` for inter-package dependencies; use `catalog:` for shared versions.

## Implementation Notes (for AI agents)

### Adapters (`adapter-drizzle`, `adapter-prisma`, `adapter-mongodb`)

- **Structure**: One file per domain (`chatters.ts`, `conversations.ts`, `participants.ts`, `blocks.ts`, `permissions.ts`), plus `shared.ts` (context type, helpers) and `index.ts` (assembles into `DatabaseAdapter`).
- **Pattern**: `createXAdapter(ctx): XAdapter` — each part implements the core interface; context holds db/schema/helpers.
- **Core contracts**: `ChatterAdapter`, `ConversationAdapter`, etc. and `DatabaseAdapter` in `packages/core/src/adapter/`.

### Handlers (`handler-next`, `handler-express`, `handler-hono`)

- **Common flow**: `toCoreRequest` → `dispatch(engine, coreReq, basePath)` → `toResponse`.
- **Express**: Requires `express.json()` before handler; `basePath` strips mount prefix.
- **Hono**: Uses `c.req.path`, `c.req.query()`, `c.req.text()` for body; returns `c.json()` or `c.body(null, 204)`.

### Tests (TESTS_POLICY)

- **Colocation**: `*.spec.ts` next to source; no separate `__tests__`.
- **Fixtures**: `packages/core/src/fixtures/` — `createMockAdapter`, `createMockChatter`, etc. For packages without fixture export, define `createMockAdapter` inline in spec.
- **Handler specs**: Mock `req`/`res` (Express) or `c` (Hono) with minimal shape (`method`, `path`, `query`, `body`).

### Lint (Biome)

- `noNonNullAssertion`: Use `result?.` not `result!` after `expect().not.toBeNull()`.
- `noUselessSwitchCase`: Remove redundant `case "next":` before `default:`.

### Commits

- Prefer conventional commits: `feat(errors)`, `feat(core)`, `docs`, `test(core)`, `refactor(adapters)`, `refactor(handlers)`, `test(packages)`, `chore`.

## Reference

- **PLAN.md**: Whitepaper and architecture spec (may contain French)
- **CLAUDE.md** (workspace rules): Bun-first conventions
- **TESTS_POLICY.md**: Strict testing policy — `.spec.ts` colocation, edge cases, mocking
