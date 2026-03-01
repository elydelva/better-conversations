import { createSchemaSqlite } from "@better-conversation/adapter-drizzle";

export const {
  chatters,
  conversations,
  participants,
  blocks,
  blockHistory,
  chatterPermissions,
  blockRegistry,
  roleRegistry,
  policies,
} = createSchemaSqlite("bc_");
