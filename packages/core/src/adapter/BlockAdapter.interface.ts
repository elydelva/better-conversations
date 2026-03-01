import type { Block, BlockFilters, BlockInput } from "../types/index.js";
import type { Paginated } from "../types/index.js";

export interface BlockAdapter {
  find(id: string): Promise<Block | null>;
  list(filters: BlockFilters): Promise<Paginated<Block>>;
  create(data: BlockInput): Promise<Block>;
  update(id: string, data: Partial<Block>): Promise<Block>;
  softDelete(id: string): Promise<void>;
}
