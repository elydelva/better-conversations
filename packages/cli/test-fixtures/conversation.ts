/**
 * Minimal config for CLI testing - no DB required.
 */
import { betterConversation } from "@better-conversation/core";
import type { DatabaseAdapter } from "@better-conversation/core";

const mockAdapter: DatabaseAdapter = {
  chatters: {
    find: async () => null,
    findByEntity: async () => null,
    create: async () => ({}) as never,
    update: async () => ({}) as never,
  },
  conversations: {
    find: async () => null,
    findByEntity: async () => [],
    list: async () => ({ items: [], total: 0 }),
    create: async () => ({}) as never,
    update: async () => ({}) as never,
  },
  participants: {
    list: async () => [],
    find: async () => null,
    add: async () => ({}) as never,
    update: async () => ({}) as never,
    remove: async () => {},
  },
  blocks: {
    find: async () => null,
    list: async () => ({ items: [], total: 0 }),
    create: async () => ({}) as never,
    update: async () => ({}) as never,
    softDelete: async () => {},
  },
  permissions: { check: async () => false, grant: async () => {}, revoke: async () => {} },
  registries: { upsertBlock: async () => {}, upsertRole: async () => {} },
  policies: {
    resolve: async () => ({}) as never,
    getGlobal: async () => ({}) as never,
    setGlobal: async () => {},
    listRoles: async () => ({ roles: [] }),
    setRole: async () => {},
    setChatter: async () => {},
    setConversation: async () => {},
    setThread: async () => {},
  },
  extensions: {},
};

export const conv = betterConversation({
  adapter: mockAdapter,
  tablePrefix: "bc_",
});
