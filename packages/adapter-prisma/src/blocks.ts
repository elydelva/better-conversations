import type { Block, BlockAdapter, BlockFilters, BlockInput } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcBlock: {
    findUnique: (args: { where: { id: string } }) => Promise<Row | null>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: unknown;
      take: number;
    }) => Promise<Row[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<Row>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Row>;
  };
};

interface Row {
  id: string;
  conversationId: string;
  authorId: string;
  type: string;
  body: string | null;
  metadata: unknown;
  threadParentId: string | null;
  status: string;
  refusalReason: string | null;
  flaggedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
}

function toBlock(row: Row): Block {
  return {
    id: row.id,
    conversationId: row.conversationId,
    authorId: row.authorId,
    type: row.type,
    body: row.body,
    metadata: row.metadata as Record<string, unknown> | null,
    threadParentId: row.threadParentId,
    status: row.status as Block["status"],
    refusalReason: row.refusalReason,
    flaggedAt: row.flaggedAt,
    editedAt: row.editedAt,
    createdAt: row.createdAt,
  };
}

export function createBlocksAdapter(ctx: PrismaAdapterContext): BlockAdapter {
  const { prisma, helpers } = ctx;
  const p = (prisma as Prisma).bcBlock;

  return {
    async find(id) {
      const row = await p.findUnique({ where: { id } });
      return row ? toBlock(row) : null;
    },
    async list(filters: BlockFilters) {
      const where: Record<string, unknown> = { conversationId: filters.conversationId };
      if (filters.authorId) where.authorId = filters.authorId;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.threadParentId != null) where.threadParentId = filters.threadParentId;
      if (filters.after || filters.before) {
        const dateCond: Record<string, Date> = {};
        if (filters.after) dateCond.gte = filters.after;
        if (filters.before) dateCond.lte = filters.before;
        where.createdAt = dateCond;
      }

      const limit = filters.limit ?? 50;
      const rows = await p.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      });
      const items = rows.slice(0, limit).map(toBlock);
      return { items, total: items.length, hasMore: rows.length > limit };
    },
    async create(data: BlockInput & { status?: Block["status"] }) {
      const id = helpers.generateId();
      const now = helpers.now();
      const status = data.status ?? "published";
      const row = await p.create({
        data: {
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
        },
      });
      return toBlock(row);
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
        await p.update({ where: { id }, data: set });
      }
      const found = await p.findUnique({ where: { id } });
      if (!found) throw new Error("Block not found");
      return toBlock(found);
    },
    async softDelete(id) {
      await p.update({
        where: { id },
        data: { status: "deleted", body: null },
      });
    },
  };
}
