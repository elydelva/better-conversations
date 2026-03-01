import type { ChatterAdapter } from "@better-conversation/core";
import type { PrismaAdapterContext } from "./shared.js";

const NOT_IMPL =
  "@better-conversation/adapter-prisma is not implemented. Use @better-conversation/adapter-drizzle.";

export function createChattersAdapter(_ctx: PrismaAdapterContext): ChatterAdapter {
  return {
    async find() {
      throw new Error(NOT_IMPL);
    },
    async findByEntity() {
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
