import type { ParticipantAdapter } from "@better-conversation/core";
import type { MongoAdapterContext } from "./shared.js";

const NOT_IMPL =
  "@better-conversation/adapter-mongodb is not implemented. Use @better-conversation/adapter-drizzle.";

export function createParticipantsAdapter(_ctx: MongoAdapterContext): ParticipantAdapter {
  return {
    async list() {
      throw new Error(NOT_IMPL);
    },
    async find() {
      throw new Error(NOT_IMPL);
    },
    async add() {
      throw new Error(NOT_IMPL);
    },
    async update() {
      throw new Error(NOT_IMPL);
    },
    async remove() {
      throw new Error(NOT_IMPL);
    },
  };
}
