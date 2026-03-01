import type { Block, BlockAdapter, BlockFilters, BlockInput } from "@better-conversation/core";
import { and, desc, eq } from "drizzle-orm";
import type { DrizzleAdapterContext } from "./shared.js";
import { toDate, val } from "./shared.js";

function mapRowToBlock(row: Record<string, unknown>): Block {
  const r = row;
  return {
    id: val(r.id, ""),
    conversationId: val(r.conversationId ?? r.conversation_id, ""),
    authorId: val(r.authorId ?? r.author_id, ""),
    type: val(r.type, ""),
    body: val(r.body, null) as string | null,
    metadata: (r.metadata as Record<string, unknown>) ?? null,
    threadParentId: val(r.threadParentId ?? r.thread_parent_id, null) as string | null,
    status: (r.status as Block["status"]) ?? "published",
    refusalReason: val(r.refusalReason ?? r.refusal_reason, null) as string | null,
    flaggedAt: toDate(r.flaggedAt ?? r.flagged_at),
    editedAt: toDate(r.editedAt ?? r.edited_at),
    createdAt: new Date((r.createdAt ?? r.created_at) as string | Date),
  };
}

async function findBlock(ctx: DrizzleAdapterContext, id: string): Promise<Block | null> {
  const { db, schema } = ctx;
  const result = await db.select().from(schema.blocks).where(eq(schema.blocks.id, id)).limit(1);
  const row = result[0];
  return row ? mapRowToBlock(row) : null;
}

export function createBlocksAdapter(ctx: DrizzleAdapterContext): BlockAdapter {
  const { db, schema, helpers } = ctx;
  const { blocks } = schema;

  return {
    async find(id) {
      return findBlock(ctx, id);
    },
    async list(filters: BlockFilters) {
      const conditions = [eq(blocks.conversationId, filters.conversationId)];
      if (filters.authorId) conditions.push(eq(blocks.authorId, filters.authorId));
      if (filters.type) conditions.push(eq(blocks.type, filters.type));
      if (filters.status) conditions.push(eq(blocks.status, filters.status));
      if (filters.threadParentId != null)
        conditions.push(eq(blocks.threadParentId, filters.threadParentId));
      const limit = filters.limit ?? 50;
      const result = await db
        .select()
        .from(blocks)
        .where(and(...conditions))
        .orderBy(desc(blocks.createdAt))
        .limit(limit + 1);
      const items = result.slice(0, limit).map((r: Record<string, unknown>) => mapRowToBlock(r));
      return { items, total: items.length, hasMore: result.length > limit };
    },
    async create(data: BlockInput & { status?: Block["status"] }) {
      const id = helpers.generateId();
      const now = helpers.now();
      const status = data.status ?? "published";
      await db.insert(blocks).values({
        id,
        conversationId: data.conversationId,
        authorId: data.authorId,
        type: data.type,
        body: data.body ?? null,
        metadata: data.metadata ?? null,
        threadParentId: data.threadParentId ?? null,
        status,
        refusalReason: null,
        flaggedAt: null,
        editedAt: null,
        createdAt: now,
      });
      return mapRowToBlock({
        id,
        conversation_id: data.conversationId,
        author_id: data.authorId,
        type: data.type,
        body: data.body ?? null,
        metadata: data.metadata ?? null,
        thread_parent_id: data.threadParentId ?? null,
        status,
        refusal_reason: null,
        flagged_at: null,
        edited_at: null,
        created_at: now,
      });
    },
    async update(id, data) {
      const set: Record<string, unknown> = {};
      if (data.body !== undefined) set.body = data.body;
      if (data.metadata !== undefined) set.metadata = data.metadata;
      if (data.status !== undefined) set.status = data.status;
      if (data.flaggedAt !== undefined) set.flaggedAt = data.flaggedAt;
      if (data.editedAt !== undefined) set.editedAt = data.editedAt;
      if (data.refusalReason !== undefined) set.refusalReason = data.refusalReason;
      if (Object.keys(set).length > 0) {
        await db.update(blocks).set(set).where(eq(blocks.id, id));
      }
      const found = await findBlock(ctx, id);
      if (!found) throw new Error("Block not found");
      return found;
    },
    async softDelete(id) {
      await db.update(blocks).set({ status: "deleted", body: null }).where(eq(blocks.id, id));
    },
  };
}
