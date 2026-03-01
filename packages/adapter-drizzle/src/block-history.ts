import { desc, eq } from "drizzle-orm";
import type { TranslateToDrizzleResult } from "./schema/translate";
import type { DrizzleAdapterContext } from "./shared";

export interface BlockHistoryRecord {
  id: string;
  blockId: string;
  version: number;
  body: string | null;
  metadata: Record<string, unknown> | null;
  editedAt: Date;
  editedBy: string | null;
  createdAt: Date;
}

export interface BlockHistoryAdapter {
  insert(record: Omit<BlockHistoryRecord, "id" | "createdAt">): Promise<BlockHistoryRecord>;
  listByBlockId(blockId: string): Promise<BlockHistoryRecord[]>;
}

export function createBlockHistoryAdapter(
  ctx: DrizzleAdapterContext & { schema: TranslateToDrizzleResult }
): BlockHistoryAdapter | undefined {
  const blockHistory = ctx.schema.blockHistory;
  if (!blockHistory) return undefined;

  const { db, helpers } = ctx;

  return {
    async insert(record) {
      const id = helpers.generateId();
      const now = helpers.now();
      await db.insert(blockHistory).values({
        id,
        blockId: record.blockId,
        version: record.version,
        body: record.body,
        metadata: record.metadata,
        editedAt: record.editedAt,
        editedBy: record.editedBy,
        createdAt: now,
      });
      return {
        ...record,
        id,
        createdAt: now,
      };
    },
    async listByBlockId(blockId) {
      const rows = await db
        .select()
        .from(blockHistory)
        .where(eq(blockHistory.blockId, blockId))
        .orderBy(desc(blockHistory.version));
      return rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        blockId: String(r.blockId ?? r.block_id),
        version: Number(r.version),
        body: r.body != null ? String(r.body) : null,
        metadata: (r.metadata as Record<string, unknown>) ?? null,
        editedAt: new Date((r.editedAt ?? r.edited_at) as string | Date),
        editedBy: r.editedBy != null ? String(r.editedBy ?? r.edited_by) : null,
        createdAt: new Date((r.createdAt ?? r.created_at) as string | Date),
      }));
    },
  };
}
