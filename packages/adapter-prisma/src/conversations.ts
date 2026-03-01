import type { ConversationAdapter } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

const NOT_IMPL =
  "@better-conversation/adapter-prisma is not implemented. Use @better-conversation/adapter-drizzle.";

export function createConversationsAdapter(_ctx: PrismaAdapterContext): ConversationAdapter {
  return {
    async find() {
      throw new Error(NOT_IMPL);
    },
    async findByEntity() {
      throw new Error(NOT_IMPL);
    },
    async list() {
      throw new Error(NOT_IMPL);
    },
    async create() {
      throw new Error(NOT_IMPL);
    },
    async update() {
      throw new Error(NOT_IMPL);
    },
  };
}
