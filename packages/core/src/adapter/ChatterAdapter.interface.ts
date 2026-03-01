import type { Chatter, ChatterInput } from "../types/index.js";
import type { Paginated } from "../types/index.js";

export interface ChatterListParams {
  limit?: number;
  cursor?: string;
}

export interface ChatterAdapter {
  find(id: string): Promise<Chatter | null>;
  findByEntity(type: string, id: string): Promise<Chatter | null>;
  list(params?: ChatterListParams): Promise<Paginated<Chatter>>;
  create(data: ChatterInput): Promise<Chatter>;
  update(id: string, data: Partial<ChatterInput>): Promise<Chatter>;
}
