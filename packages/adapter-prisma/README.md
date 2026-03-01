# @better-conversation/adapter-prisma

Prisma adapter for better-conversation.

## Setup

1. Copy the models from `schema.prisma` (or `node_modules/@better-conversation/adapter-prisma/schema`) into your app's `prisma/schema.prisma`. Ensure you have a `datasource` and `generator` block.

2. Run migrations:
   ```bash
   bunx prisma generate
   bunx prisma db push   # or prisma migrate dev
   ```

3. Create the engine with the Prisma adapter:
   ```ts
   import { betterConversation } from "@better-conversation/core";
   import { prismaAdapter } from "@better-conversation/adapter-prisma";
   import { PrismaClient } from "@prisma/client";

   const prisma = new PrismaClient();
   const engine = betterConversation({
     adapter: prismaAdapter(prisma),
   });
   await engine.init();
   ```

## Schema

The schema includes: `BcChatter`, `BcConversation`, `BcParticipant`, `BcBlock`, `BcChatterPermission`, `BcBlockRegistry`, `BcRoleRegistry`, `BcPolicy`.

Run `bun run schema:print` in this package to output the schema for copying.
