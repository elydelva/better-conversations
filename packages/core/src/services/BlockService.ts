import {
  BlockNotFoundError,
  BlockRefusedError,
  ChatterNotFoundError,
  ConversationNotFoundError,
} from "@better-conversation/errors";
import type { DatabaseAdapter } from "../adapter/index.js";
import type { BlockAfterSendCtx } from "../hooks/BlockAfterSend.js";
import type { BlockOutcomes } from "../hooks/BlockBeforeSend.js";
import type { BlockBeforeSendCtx } from "../hooks/BlockBeforeSend.js";
import type { DeleteOutcomes } from "../hooks/BlockDelete.js";
import type { BlockDeleteCtx } from "../hooks/BlockDelete.js";
import { createBlockOutcomes, createDeleteOutcomes } from "../hooks/OutcomeBuilder.js";
import type { HookResult } from "../hooks/common.js";
import type { Block, BlockFilters, BlockInput, Paginated } from "../types/index.js";

export interface BlockServiceConfig {
  adapter: DatabaseAdapter;
  hooks?: {
    onBlockBeforeSend?: (ctx: BlockBeforeSendCtx, outcomes: BlockOutcomes) => Promise<HookResult>;
    onBlockAfterSend?: (ctx: BlockAfterSendCtx) => Promise<void>;
    onBlockBeforeDelete?: (ctx: BlockDeleteCtx, outcomes: DeleteOutcomes) => Promise<HookResult>;
  };
  generateId?: () => string;
}

export class BlockService {
  constructor(private readonly config: BlockServiceConfig) {}

  private get blocks() {
    return this.config.adapter.blocks;
  }

  async send(input: BlockInput): Promise<Block> {
    const { adapter, hooks, generateId } = this.config;
    const genId = generateId ?? (() => crypto.randomUUID());

    const conversation = await adapter.conversations.find(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    const author = await adapter.chatters.find(input.authorId);
    if (!author) {
      throw new ChatterNotFoundError(input.authorId);
    }

    const participants = await adapter.participants.list(input.conversationId);
    const isThread = !!input.threadParentId;
    const isFirstReply = isThread
      ? (
          await adapter.blocks.list({
            conversationId: input.conversationId,
            threadParentId: input.threadParentId,
            limit: 1,
          })
        ).items.length === 0
      : false;

    const ctx: BlockBeforeSendCtx = {
      block: input,
      conversation,
      author,
      participants,
      adapter,
      isThread,
      isFirstReply,
    };

    const outcomes = createBlockOutcomes();
    const result = hooks?.onBlockBeforeSend
      ? await hooks.onBlockBeforeSend(ctx, outcomes)
      : await outcomes.next();

    let blockToCreate = input;
    let status: Block["status"] = "published";

    switch (result.type) {
      case "refuse": {
        throw new BlockRefusedError(result.reason, result.options);
      }
      case "transform":
        blockToCreate = result.data;
        break;
      case "flag":
        status = "published";
        blockToCreate = { ...input };
        break;
      case "queue":
        status = "pending_review";
        break;
      case "defer":
        break;
      default:
        break;
    }

    const createPayload = {
      ...blockToCreate,
      status,
    } as BlockInput & { status: Block["status"] };

    let block = await this.blocks.create(createPayload);

    if (result.type === "flag") {
      block = await this.blocks.update(block.id, { flaggedAt: new Date() });
    }

    if (result.type === "defer" && result.fn) {
      result.fn().catch(() => {});
    }

    if (hooks?.onBlockAfterSend) {
      const afterCtx: BlockAfterSendCtx = {
        block,
        conversation,
        author,
        participants,
      };
      await hooks.onBlockAfterSend(afterCtx);
    }

    return block;
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
    const block = await this.blocks.find(id);
    if (!block) {
      throw new BlockNotFoundError(id);
    }

    const conversation = await this.config.adapter.conversations.find(block.conversationId);
    const author = await this.config.adapter.chatters.find(block.authorId);

    if (conversation && author) {
      const ctx: BlockDeleteCtx = { block, conversation, author };
      const outcomes = createDeleteOutcomes();
      const result = this.config.hooks?.onBlockBeforeDelete
        ? await this.config.hooks.onBlockBeforeDelete(ctx, outcomes)
        : await outcomes.next();

      if (result.type === "refuse") {
        throw new BlockRefusedError(result.reason, result.options);
      }
    }

    return this.blocks.softDelete(id);
  }
}
