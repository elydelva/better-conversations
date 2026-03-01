import type { Conversation, ConversationFilters, ConversationInput } from "../types/index.js";
import type { Paginated } from "../types/index.js";

export interface ConversationAdapter {
  find(id: string): Promise<Conversation | null>;
  findByEntity(type: string, id: string): Promise<Conversation[]>;
  list(filters: ConversationFilters): Promise<Paginated<Conversation>>;
  create(data: ConversationInput): Promise<Conversation>;
  update(id: string, data: Partial<Conversation>): Promise<Conversation>;
}
