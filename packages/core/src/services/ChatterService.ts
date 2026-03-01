import type { ChatterAdapter, ChatterListParams } from "../adapter/index.js";
import type { Chatter, ChatterInput, Paginated } from "../types/index.js";

export class ChatterService {
  constructor(private readonly chatters: ChatterAdapter) {}

  async list(params?: ChatterListParams): Promise<Paginated<Chatter>> {
    return this.chatters.list(params);
  }

  async find(id: string): Promise<Chatter | null> {
    return this.chatters.find(id);
  }

  async findByEntity(type: string, id: string): Promise<Chatter | null> {
    return this.chatters.findByEntity(type, id);
  }

  async create(data: ChatterInput): Promise<Chatter> {
    return this.chatters.create(data);
  }

  async update(id: string, data: Partial<ChatterInput>): Promise<Chatter> {
    return this.chatters.update(id, data);
  }
}
