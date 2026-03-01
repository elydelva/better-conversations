import { ConversationArchivedError, ConversationNotFoundError } from "@better-conversation/errors";
import type { ConversationAdapter } from "../adapter/index.js";
import type { ConversationEngine } from "../engine.js";
import type { ConversationAfterCreateCtx } from "../hooks/ConversationAfterCreate.js";
import type {
  Conversation,
  ConversationFilters,
  ConversationInput,
  Paginated,
} from "../types/index.js";

export interface ConversationServiceConfig {
  conversations: ConversationAdapter;
  hooks?: { onConversationAfterCreate?: (ctx: ConversationAfterCreateCtx) => Promise<void> };
  engine?: ConversationEngine;
}

export class ConversationService {
  constructor(private readonly config: ConversationAdapter | ConversationServiceConfig) {
    if ("conversations" in config) {
      this.conversations = config.conversations;
      this.hooks = config.hooks;
      this.engine = config.engine;
    } else {
      this.conversations = config;
      this.hooks = undefined;
      this.engine = undefined;
    }
  }

  private readonly conversations: ConversationAdapter;
  private readonly hooks?: ConversationServiceConfig["hooks"];
  private readonly engine?: ConversationEngine;

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
    const conv = await this.conversations.create(data);
    if (this.hooks?.onConversationAfterCreate && this.engine) {
      const participants = await this.engine.participants.list(conv.id);
      await this.hooks.onConversationAfterCreate({ conversation: conv, participants });
    }
    return conv;
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
