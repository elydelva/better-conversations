export interface BlockHistoryAdapter {
  insert(record: {
    blockId: string;
    version: number;
    body: string | null;
    metadata: Record<string, unknown> | null;
    editedAt: Date;
    editedBy: string | null;
  }): Promise<BlockHistoryEntry>;
  listByBlockId(blockId: string): Promise<BlockHistoryEntry[]>;
}

export interface BlockHistoryEntry {
  id: string;
  blockId: string;
  version: number;
  body: string | null;
  metadata: Record<string, unknown> | null;
  editedAt: Date;
  editedBy: string | null;
  createdAt: Date;
}

export class HistoryService {
  constructor(
    private readonly adapter: BlockHistoryAdapter,
    private readonly generateId: () => string = () => crypto.randomUUID()
  ) {}

  async record(
    blockId: string,
    previous: { body: string | null; metadata: Record<string, unknown> | null },
    editedBy: string | null,
    editedAt: Date = new Date()
  ): Promise<BlockHistoryEntry> {
    const existing = await this.adapter.listByBlockId(blockId);
    const version = existing.length > 0 ? Math.max(...existing.map((e) => e.version)) + 1 : 1;
    const record = await this.adapter.insert({
      blockId,
      version,
      body: previous.body,
      metadata: previous.metadata,
      editedAt,
      editedBy,
    });
    return record;
  }

  async list(blockId: string): Promise<BlockHistoryEntry[]> {
    return this.adapter.listByBlockId(blockId);
  }
}
