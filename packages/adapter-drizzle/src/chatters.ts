import type { Chatter, ChatterAdapter, ChatterInput } from "@better-conversation/core";
import { and, desc, eq, lt } from "drizzle-orm";
import type { DrizzleAdapterContext } from "./shared";
import { val } from "./shared";

function mapRowToChatter(row: Record<string, unknown>): Chatter {
  const r = row;
  return {
    id: val(r.id, ""),
    displayName: val(r.displayName ?? r.display_name, ""),
    avatarUrl: val(r.avatarUrl ?? r.avatar_url, null) as string | null,
    entityType: val(r.entityType ?? r.entity_type, ""),
    entityId: val(r.entityId ?? r.entity_id, null) as string | null,
    metadata: (r.metadata as Record<string, unknown>) ?? null,
    isActive: val(r.isActive ?? r.is_active, true) as boolean,
    createdAt: new Date((r.createdAt ?? r.created_at) as string | Date),
    updatedAt: new Date((r.updatedAt ?? r.updated_at) as string | Date),
  };
}

async function findChatter(ctx: DrizzleAdapterContext, id: string): Promise<Chatter | null> {
  const { db, schema } = ctx;
  const result = await db.select().from(schema.chatters).where(eq(schema.chatters.id, id)).limit(1);
  const row = result[0];
  return row ? mapRowToChatter(row) : null;
}

export function createChattersAdapter(ctx: DrizzleAdapterContext): ChatterAdapter {
  const { db, schema, helpers } = ctx;
  const { chatters } = schema;

  return {
    async find(id) {
      return findChatter(ctx, id);
    },
    async list(params) {
      const limit = Math.min(Math.max(params?.limit ?? 50, 1), 100);
      const rows = params?.cursor
        ? (() => {
            const cursorDate = new Date(params.cursor);
            if (Number.isNaN(cursorDate.getTime())) {
              return db
                .select()
                .from(chatters)
                .orderBy(desc(chatters.createdAt))
                .limit(limit + 1);
            }
            return db
              .select()
              .from(chatters)
              .where(lt(chatters.createdAt, cursorDate))
              .orderBy(desc(chatters.createdAt))
              .limit(limit + 1);
          })()
        : db
            .select()
            .from(chatters)
            .orderBy(desc(chatters.createdAt))
            .limit(limit + 1);
      const result = await rows;
      const hasMore = result.length > limit;
      const items = result.slice(0, limit).map((r: Record<string, unknown>) => mapRowToChatter(r));
      const last = items[items.length - 1];
      const cursor = hasMore && last ? last.createdAt.toISOString() : undefined;
      return {
        items,
        total: items.length,
        cursor: cursor ?? null,
        hasMore,
      };
    },
    async findByEntity(type, entityId) {
      const result = await db
        .select()
        .from(chatters)
        .where(and(eq(chatters.entityType, type), eq(chatters.entityId, entityId)))
        .limit(1);
      const row = result[0];
      return row ? mapRowToChatter(row) : null;
    },
    async create(data) {
      const id = helpers.generateId();
      const now = helpers.now();
      await db.insert(chatters).values({
        id,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl ?? null,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        metadata: data.metadata ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      return mapRowToChatter({
        id,
        display_name: data.displayName,
        avatar_url: data.avatarUrl ?? null,
        entity_type: data.entityType,
        entity_id: data.entityId ?? null,
        metadata: data.metadata ?? null,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    },
    async update(id, data) {
      const now = helpers.now();
      await db
        .update(chatters)
        .set({
          ...(data.displayName !== undefined && {
            displayName: data.displayName,
          }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          ...(data.entityType !== undefined && {
            entityType: data.entityType,
          }),
          ...(data.entityId !== undefined && { entityId: data.entityId }),
          ...(data.metadata !== undefined && { metadata: data.metadata }),
          updatedAt: now,
        })
        .where(eq(chatters.id, id));
      const found = await findChatter(ctx, id);
      if (!found) throw new Error("Chatter not found");
      return found;
    },
  };
}
