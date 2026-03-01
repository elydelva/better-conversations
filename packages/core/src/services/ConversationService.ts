import { ConversationArchivedError, ConversationNotFoundError } from "@better-conversation/errors";
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
    const existing = await this.conversations.find(id);
    if (!existing) {
      throw new ConversationNotFoundError(id);
    }
    if (existing.status === "archived") {
      throw new ConversationArchivedError(id);
    }
    return this.conversations.update(id, data);
  }

  async archive(id: string): Promise<Conversation> {
    const existing = await this.conversations.find(id);
    if (!existing) {
      throw new ConversationNotFoundError(id);
    }
    if (existing.status === "archived") {
      throw new ConversationArchivedError(id);
    }
    return this.conversations.update(id, { status: "archived" });
  }
}
