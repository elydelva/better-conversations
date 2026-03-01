import type { BlockAdapter } from "../adapter/index.js";
import type { Block, BlockFilters, BlockInput, Paginated } from "../types/index.js";

export class BlockService {
  constructor(private readonly blocks: BlockAdapter) {}

  async send(input: BlockInput): Promise<Block> {
    // Stub: delegates directly to adapter. Hook pipeline to be implemented later.
    return this.blocks.create(input);
  }

  async list(filters: BlockFilters): Promise<Paginated<Block>> {
    return this.blocks.list(filters);
  }

  async find(id: string): Promise<Block | null> {
    return this.blocks.find(id);
  }

  async updateMeta(id: string, data: Partial<Pick<Block, "body" | "metadata">>): Promise<Block> {
    return this.blocks.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.blocks.softDelete(id);
  }
}
