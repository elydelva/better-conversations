import type { RoleRegistry } from "./interface.js";

export const defaultRoleRegistry: RoleRegistry = {
  member: {
    name: "member",
    policy: {
      allowedBlocks: ["text"],
      maxBlocksPerMinute: 20,
      maxBlocksPerHour: 200,
      editWindowSeconds: 300,
      canEditOwnBlocks: true,
      canDeleteOwnBlocks: true,
      threadsEnabled: true,
      maxThreadDepth: 1,
    },
  },
  owner: {
    name: "owner",
    policy: {
      allowedBlocks: "*",
      maxBlocksPerMinute: 60,
      editWindowSeconds: undefined,
      canEditOwnBlocks: true,
      canDeleteOwnBlocks: true,
      threadsEnabled: true,
      maxThreadDepth: 1,
    },
  },
  moderator: {
    name: "moderator",
    policy: {
      allowedBlocks: "*",
      maxBlocksPerMinute: 60,
      editWindowSeconds: undefined,
      canEditOwnBlocks: true,
      canDeleteOwnBlocks: true,
      threadsEnabled: true,
      maxThreadDepth: 1,
    },
  },
  observer: {
    name: "observer",
    policy: {
      readOnly: true,
      allowedBlocks: [],
    },
  },
  bot: {
    name: "bot",
    policy: {
      allowedBlocks: "*",
      maxBlocksPerMinute: undefined,
      canEditOwnBlocks: false,
      threadsEnabled: true,
      maxThreadDepth: 1,
    },
  },
};
