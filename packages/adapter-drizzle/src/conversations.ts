import type {
  Conversation,
  ConversationAdapter,
  ConversationFilters,
  ConversationInput,
} from "@better-conversation/core";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { DrizzleAdapterContext } from "./shared";
import { val } from "./shared";

function mapRowToConversation(row: Record<string, unknown>): Conversation {
  const r = row;
  return {
    id: val(r.id, ""),
    title: val(r.title, null) as string | null,
    status: (r.status as "open" | "archived" | "locked") ?? "open",
    entityType: val(r.entityType ?? r.entity_type, null) as string | null,
    entityId: val(r.entityId ?? r.entity_id, null) as string | null,
    createdBy: val(r.createdBy ?? r.created_by, ""),
    metadata: (r.metadata as Record<string, unknown>) ?? null,
    createdAt: new Date((r.createdAt ?? r.created_at) as string | Date),
    updatedAt: new Date((r.updatedAt ?? r.updated_at) as string | Date),
  };
}

async function findConversation(
  ctx: DrizzleAdapterContext,
  id: string
): Promise<Conversation | null> {
  const { db, schema } = ctx;
  const result = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .limit(1);
  const row = result[0];
  return row ? mapRowToConversation(row) : null;
}

export function createConversationsAdapter(ctx: DrizzleAdapterContext): ConversationAdapter {
  const { db, schema, helpers } = ctx;
  const { conversations, participants } = schema;

  return {
    async find(id) {
      return findConversation(ctx, id);
    },
    async findByEntity(type, entityId) {
      const result = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.entityType, type), eq(conversations.entityId, entityId)));
      return result.map((r: Record<string, unknown>) => mapRowToConversation(r));
    },
    async list(filters: ConversationFilters) {
      const conditions = [];
      if (filters.entityType) conditions.push(eq(conversations.entityType, filters.entityType));
      if (filters.entityId) conditions.push(eq(conversations.entityId, filters.entityId));
      if (filters.status) conditions.push(eq(conversations.status, filters.status));
      const limit = filters.limit ?? 50;

      if (filters.chatterId) {
        const chatterId = filters.chatterId;
        const participantConvs = await db
          .select({ conversationId: participants.conversationId })
          .from(participants)
          .where(eq(participants.chatterId, chatterId));
        const convIds = participantConvs.map((p: { conversationId: string }) => p.conversationId);
        if (convIds.length === 0) {
          return { items: [], total: 0, hasMore: false };
        }
        conditions.push(inArray(conversations.id, convIds));
      }

      let query = db.select().from(conversations);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      const result = await query.orderBy(desc(conversations.createdAt)).limit(limit + 1);
      const items = result
        .slice(0, limit)
        .map((r: Record<string, unknown>) => mapRowToConversation(r));
      return { items, total: items.length, hasMore: result.length > limit };
    },
    async create(data: ConversationInput) {
      const id = helpers.generateId();
      const now = helpers.now();
      await db.insert(conversations).values({
        id,
        title: data.title ?? null,
        status: data.status ?? "open",
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        createdBy: data.createdBy,
        metadata: data.metadata ?? null,
        createdAt: now,
        updatedAt: now,
      });
      return mapRowToConversation({
        id,
        title: data.title ?? null,
        status: data.status ?? "open",
        entity_type: data.entityType ?? null,
        entity_id: data.entityId ?? null,
        created_by: data.createdBy,
        metadata: data.metadata ?? null,
        created_at: now,
        updated_at: now,
      });
    },
    async update(id, data) {
      const now = helpers.now();
      const set: Record<string, unknown> = { updatedAt: now };
      if (data.title !== undefined) set.title = data.title;
      if (data.status !== undefined) set.status = data.status;
      if (data.entityType !== undefined) set.entityType = data.entityType;
      if (data.entityId !== undefined) set.entityId = data.entityId;
      if (data.metadata !== undefined) set.metadata = data.metadata;
      await db.update(conversations).set(set).where(eq(conversations.id, id));
      const found = await findConversation(ctx, id);
      if (!found) throw new Error("Conversation not found");
      return found;
    },
  };
}
