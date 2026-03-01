import type { Chatter, ChatterAdapter, ChatterInput } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcChatter: {
    findUnique: (args: { where: { id: string } }) => Promise<Row | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Row | null>;
    findMany: (args: {
      orderBy?: { createdAt: "asc" | "desc" };
      take?: number;
      skip?: number;
      cursor?: { createdAt: Date };
      where?: { createdAt?: { lt: Date } };
    }) => Promise<Row[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<Row>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Row>;
  };
};

interface Row {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toChatter(row: Row): Chatter {
  return {
    id: row.id,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata as Record<string, unknown> | null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createChattersAdapter(ctx: PrismaAdapterContext): ChatterAdapter {
  const { prisma, helpers } = ctx;
  const p = (prisma as Prisma).bcChatter;

  return {
    async find(id) {
      const row = await p.findUnique({ where: { id } });
      return row ? toChatter(row) : null;
    },
    async findByEntity(type, entityId) {
      const row = await p.findFirst({
        where: { entityType: type, entityId },
      });
      return row ? toChatter(row) : null;
    },
    async list(params) {
      const limit = Math.min(Math.max(params?.limit ?? 50, 1), 100);
      const cursor = params?.cursor ? new Date(params.cursor) : null;
      const rows = cursor
        ? await p.findMany({
            where: { createdAt: { lt: cursor } },
            orderBy: { createdAt: "desc" },
            take: limit + 1,
          })
        : await p.findMany({
            orderBy: { createdAt: "desc" },
            take: limit + 1,
          });
      const hasMore = rows.length > limit;
      const items = rows.slice(0, limit).map((r) => toChatter(r));
      const last = items[items.length - 1];
      return {
        items,
        total: items.length,
        cursor: hasMore && last ? last.createdAt.toISOString() : null,
        hasMore,
      };
    },
    async create(data: ChatterInput) {
      const id = helpers.generateId();
      const row = await p.create({
        data: {
          id,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl ?? null,
          entityType: data.entityType,
          entityId: data.entityId ?? null,
          metadata: data.metadata ?? null,
        },
      });
      return toChatter(row);
    },
    async update(id, data) {
      const row = await p.update({
        where: { id },
        data: {
          ...(data.displayName !== undefined && { displayName: data.displayName }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          ...(data.entityType !== undefined && { entityType: data.entityType }),
          ...(data.entityId !== undefined && { entityId: data.entityId }),
          ...(data.metadata !== undefined && { metadata: data.metadata }),
        },
      });
      return toChatter(row);
    },
  };
}
