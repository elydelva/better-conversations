import type {
  Conversation,
  ConversationAdapter,
  ConversationFilters,
  ConversationInput,
} from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcConversation: {
    findUnique: (args: { where: { id: string } }) => Promise<Row | null>;
    findMany: (args: {
      where?: Record<string, unknown>;
      orderBy?: unknown;
      take?: number;
      skip?: number;
    }) => Promise<Row[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<Row>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Row>;
  };
  bcParticipant: {
    findMany: (args: {
      where: { chatterId: string };
      select: { conversationId: boolean };
    }) => Promise<{ conversationId: string }[]>;
  };
};

interface Row {
  id: string;
  title: string | null;
  status: string;
  entityType: string | null;
  entityId: string | null;
  createdBy: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function toConversation(row: Row): Conversation {
  return {
    id: row.id,
    title: row.title,
    status: row.status as "open" | "archived" | "locked",
    entityType: row.entityType,
    entityId: row.entityId,
    createdBy: row.createdBy,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createConversationsAdapter(ctx: PrismaAdapterContext): ConversationAdapter {
  const { prisma, helpers } = ctx;
  const conv = (prisma as Prisma).bcConversation;
  const part = (prisma as Prisma).bcParticipant;

  return {
    async find(id) {
      const row = await conv.findUnique({ where: { id } });
      return row ? toConversation(row) : null;
    },
    async findByEntity(type, entityId) {
      const rows = await conv.findMany({
        where: { entityType: type, entityId },
      });
      return rows.map(toConversation);
    },
    async list(filters: ConversationFilters) {
      const where: Record<string, unknown> = {};
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.entityId) where.entityId = filters.entityId;
      if (filters.status) where.status = filters.status;

      if (filters.chatterId) {
        const participantConvs = await part.findMany({
          where: { chatterId: filters.chatterId },
          select: { conversationId: true },
        });
        const convIds = participantConvs.map((p) => p.conversationId);
        if (convIds.length === 0) {
          return { items: [], total: 0, hasMore: false };
        }
        where.id = { in: convIds };
      }

      const limit = filters.limit ?? 50;
      const rows = await conv.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      });
      const items = rows.slice(0, limit).map(toConversation);
      return { items, total: items.length, hasMore: rows.length > limit };
    },
    async create(data: ConversationInput) {
      const id = helpers.generateId();
      const row = await conv.create({
        data: {
          id,
          title: data.title ?? null,
          status: data.status ?? "open",
          entityType: data.entityType ?? null,
          entityId: data.entityId ?? null,
          createdBy: data.createdBy,
          metadata: data.metadata ?? null,
        },
      });
      return toConversation(row);
    },
    async update(id, data) {
      const set: Record<string, unknown> = {};
      if (data.title !== undefined) set.title = data.title;
      if (data.status !== undefined) set.status = data.status;
      if (data.entityType !== undefined) set.entityType = data.entityType;
      if (data.entityId !== undefined) set.entityId = data.entityId;
      if (data.metadata !== undefined) set.metadata = data.metadata;
      const row = await conv.update({ where: { id }, data: set });
      return toConversation(row);
    },
  };
}
