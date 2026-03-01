import type { Participant, ParticipantAdapter, ParticipantInput } from "@better-conversation/core";
import { and, eq } from "drizzle-orm";
import type { DrizzleAdapterContext } from "./shared";
import { toDate, val } from "./shared";

function mapRowToParticipant(row: Record<string, unknown>): Participant {
  const r = row;
  return {
    id: val(r.id, ""),
    conversationId: val(r.conversationId ?? r.conversation_id, ""),
    chatterId: val(r.chatterId ?? r.chatter_id, ""),
    role: val(r.role, ""),
    joinedAt: new Date((r.joinedAt ?? r.joined_at) as string | Date),
    leftAt: toDate(r.leftAt ?? r.left_at),
    lastReadAt: toDate(r.lastReadAt ?? r.last_read_at),
    metadata: (r.metadata as Record<string, unknown>) ?? null,
  };
}

export function createParticipantsAdapter(ctx: DrizzleAdapterContext): ParticipantAdapter {
  const { db, schema, helpers } = ctx;
  const { participants } = schema;

  return {
    async list(conversationId) {
      const result = await db
        .select()
        .from(participants)
        .where(eq(participants.conversationId, conversationId));
      return result.map((r: Record<string, unknown>) => mapRowToParticipant(r));
    },
    async find(conversationId, chatterId) {
      const result = await db
        .select()
        .from(participants)
        .where(
          and(
            eq(participants.conversationId, conversationId),
            eq(participants.chatterId, chatterId)
          )
        )
        .limit(1);
      const row = result[0];
      return row ? mapRowToParticipant(row) : null;
    },
    async add(data: ParticipantInput) {
      const id = helpers.generateId();
      const now = helpers.now();
      await db.insert(participants).values({
        id,
        conversationId: data.conversationId,
        chatterId: data.chatterId,
        role: data.role,
        joinedAt: now,
        leftAt: null,
        lastReadAt: null,
        metadata: null,
      });
      return mapRowToParticipant({
        id,
        conversation_id: data.conversationId,
        chatter_id: data.chatterId,
        role: data.role,
        joined_at: now,
        left_at: null,
        last_read_at: null,
        metadata: null,
      });
    },
    async update(id, data) {
      const set: Record<string, unknown> = {};
      if (data.role !== undefined) set.role = data.role;
      if (data.leftAt !== undefined) set.leftAt = data.leftAt;
      if (data.lastReadAt !== undefined) set.lastReadAt = data.lastReadAt;
      if (data.metadata !== undefined) set.metadata = data.metadata;
      if (Object.keys(set).length === 0) {
        const found = await db.select().from(participants).where(eq(participants.id, id)).limit(1);
        const row = found[0];
        if (!row) throw new Error("Participant not found");
        return mapRowToParticipant(row);
      }
      await db.update(participants).set(set).where(eq(participants.id, id));
      const all = await db.select().from(participants).where(eq(participants.id, id)).limit(1);
      const row = all[0];
      if (!row) throw new Error("Participant not found");
      return mapRowToParticipant(row);
    },
    async remove(id) {
      await db.delete(participants).where(eq(participants.id, id));
    },
  };
}
