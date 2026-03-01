import type { Chatter, ChatterAdapter, ChatterInput } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

type Prisma = PrismaAdapterContext["prisma"] & {
  bcChatter: {
    findUnique: (args: { where: { id: string } }) => Promise<Row | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Row | null>;
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
