import type { Chatter, ChatterInput } from "../types/index.js";

export interface ChatterAdapter {
  find(id: string): Promise<Chatter | null>;
  findByEntity(type: string, id: string): Promise<Chatter | null>;
  create(data: ChatterInput): Promise<Chatter>;
  update(id: string, data: Partial<ChatterInput>): Promise<Chatter>;
}
