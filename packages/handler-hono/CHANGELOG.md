# @better-conversation/handler-hono

## 1.0.1

### Patch Changes

- Migration @better-agnostic: ConversationError extends BaseError, core uses agnostic adapter/schema/handler, handlers are thin wrappers. Publication prep: biome fixes, explicit @better-agnostic versions.
- Updated dependencies
  - @better-conversation/core@1.0.1

## 1.0.0

### Major Changes

- # Release v1.0.0 — Stable API

  ## Summary

  Better-conversations reaches v1.0 with a stable, production-ready API.

  ### Core

  - Policy system (multi-level merge, roles, createRole)
  - Hooks pipeline (onBlockBeforeSend, onBlockAfterSend, etc.)
  - Blocks registry, thread support, soft delete
  - SSE endpoint (`GET /conversations/:id/stream`)

  ### Adapters

  - Drizzle (PostgreSQL, SQLite, MySQL)
  - Prisma
  - MongoDB

  ### Handlers

  - Next.js App Router
  - Express
  - Hono
  - Fastify

  ### Client & React

  - `createConversationClient` browser SDK
  - React hooks: useConversation, useBlocks, useParticipants, usePolicy, useInfiniteBlocks

  ### Plugins

  - SSE (built-in stream endpoint)
  - Audit log (createAuditPlugin)

  ### Tooling

  - Conformance test suite (runConformanceTests)
  - Benchmarks package
  - Documentation site (Fumadocs)
  - Policy playground
  - Example apps (drizzle-nextjs, drizzle-express, drizzle-hono, prisma-nextjs, mongodb-express)

  ### Breaking changes

  - None from previous 0.x — this is the first stable release.

### Patch Changes

- Updated dependencies
  - @better-conversation/core@1.0.0
