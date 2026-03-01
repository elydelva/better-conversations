import type { ConversationAdapter } from "../adapter/index.js";
import type {
  Conversation,
  ConversationFilters,
  ConversationInput,
  Paginated,
} from "../types/index.js";

export class ConversationService {
  constructor(private readonly conversations: ConversationAdapter) {}

  async find(id: string): Promise<Conversation | null> {
    return this.conversations.find(id);
  }

  async findByEntity(type: string, id: string): Promise<Conversation[]> {
    return this.conversations.findByEntity(type, id);
  }

  async list(filters: ConversationFilters): Promise<Paginated<Conversation>> {
    return this.conversations.list(filters);
  }

  async create(data: ConversationInput): Promise<Conversation> {
    return this.conversations.create(data);
  }

  async update(id: string, data: Partial<Conversation>): Promise<Conversation> {
    return this.conversations.update(id, data);
  }

  async archive(id: string): Promise<Conversation> {
    return this.conversations.update(id, { status: "archived" });
  }
}
