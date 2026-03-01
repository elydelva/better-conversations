import { createSchema } from "@better-conversation/adapter-drizzle";

const schema = createSchema("bc_");
export const chatters = schema.chatters;
export const conversations = schema.conversations;
export const participants = schema.participants;
export const blocks = schema.blocks;
export const chatterPermissions = schema.chatterPermissions;
export const blockRegistry = schema.blockRegistry;
export const roleRegistry = schema.roleRegistry;
export const policies = schema.policies;
