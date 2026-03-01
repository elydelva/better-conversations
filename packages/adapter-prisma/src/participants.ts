import type { Participant, ParticipantAdapter, ParticipantInput } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcParticipant: {
    findMany: (args: { where: Record<string, unknown> }) => Promise<Row[]>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Row | null>;
    findUnique: (args: { where: { id: string } }) => Promise<Row | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<Row>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Row>;
    delete: (args: { where: { id: string } }) => Promise<Row>;
  };
};

interface Row {
  id: string;
  conversationId: string;
  chatterId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  lastReadAt: Date | null;
  metadata: unknown;
}

function toParticipant(row: Row): Participant {
  return {
    id: row.id,
    conversationId: row.conversationId,
    chatterId: row.chatterId,
    role: row.role,
    joinedAt: row.joinedAt,
    leftAt: row.leftAt,
    lastReadAt: row.lastReadAt,
    metadata: row.metadata as Record<string, unknown> | null,
  };
}

export function createParticipantsAdapter(ctx: PrismaAdapterContext): ParticipantAdapter {
  const { prisma, helpers } = ctx;
  const p = (prisma as Prisma).bcParticipant;

  return {
    async list(conversationId) {
      const rows = await p.findMany({ where: { conversationId } });
      return rows.map(toParticipant);
    },
    async find(conversationId, chatterId) {
      const row = await p.findFirst({
        where: { conversationId, chatterId },
      });
      return row ? toParticipant(row) : null;
    },
    async add(data: ParticipantInput) {
      const id = helpers.generateId();
      const now = helpers.now();
      const row = await p.create({
        data: {
          id,
          conversationId: data.conversationId,
          chatterId: data.chatterId,
          role: data.role,
          joinedAt: now,
          leftAt: null,
          lastReadAt: null,
          metadata: null,
        },
      });
      return toParticipant(row);
    },
    async update(id, data) {
      const set: Record<string, unknown> = {};
      if (data.role !== undefined) set.role = data.role;
      if (data.leftAt !== undefined) set.leftAt = data.leftAt;
      if (data.lastReadAt !== undefined) set.lastReadAt = data.lastReadAt;
      if (data.metadata !== undefined) set.metadata = data.metadata;
      if (Object.keys(set).length === 0) {
        const row = await p.findUnique({ where: { id } });
        if (!row) throw new Error("Participant not found");
        return toParticipant(row);
      }
      const row = await p.update({ where: { id }, data: set });
      return toParticipant(row);
    },
    async remove(id) {
      await p.delete({ where: { id } });
    },
  };
}
