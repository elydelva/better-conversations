import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export function createSchema(prefix = "bc_") {
  const statusEnum = pgEnum(`${prefix}conversation_status`, ["open", "archived", "locked"]);
  const blockStatusEnum = pgEnum(`${prefix}block_status`, [
    "published",
    "pending_review",
    "refused",
    "deleted",
  ]);

  const chatters = pgTable(`${prefix}chatters`, {
    id: varchar("id", { length: 36 }).primaryKey(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 255 }),
    metadata: jsonb("metadata"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });

  const conversations = pgTable(`${prefix}conversations`, {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 255 }),
    status: statusEnum("status").notNull().default("open"),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: varchar("entity_id", { length: 255 }),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });

  const participants = pgTable(`${prefix}participants`, {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => conversations.id),
    chatterId: varchar("chatter_id", { length: 36 })
      .notNull()
      .references(() => chatters.id),
    role: varchar("role", { length: 64 }).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
    lastReadAt: timestamp("last_read_at"),
    metadata: jsonb("metadata"),
  });

  const blocks = pgTable(`${prefix}blocks`, {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => conversations.id),
    authorId: varchar("author_id", { length: 36 })
      .notNull()
      .references(() => chatters.id),
    type: varchar("type", { length: 128 }).notNull(),
    body: text("body"),
    metadata: jsonb("metadata"),
    threadParentId: varchar("thread_parent_id", { length: 36 }),
    status: blockStatusEnum("status").notNull().default("published"),
    refusalReason: text("refusal_reason"),
    flaggedAt: timestamp("flagged_at"),
    editedAt: timestamp("edited_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  const chatterPermissions = pgTable(`${prefix}chatter_permissions`, {
    id: varchar("id", { length: 36 }).primaryKey(),
    chatterId: varchar("chatter_id", { length: 36 })
      .notNull()
      .references(() => chatters.id),
    action: varchar("action", { length: 128 }).notNull(),
    scope: varchar("scope", { length: 255 }),
    granted: boolean("granted").default(true).notNull(),
  });

  const blockRegistry = pgTable(`${prefix}block_registry`, {
    type: varchar("type", { length: 128 }).primaryKey(),
    schemaJson: jsonb("schema_json").notNull(),
    isBuiltIn: boolean("is_built_in").default(false).notNull(),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  });

  const roleRegistry = pgTable(`${prefix}role_registry`, {
    name: varchar("name", { length: 64 }).primaryKey(),
    extends: varchar("extends", { length: 64 }),
    policy: jsonb("policy").notNull(),
    isBuiltIn: boolean("is_built_in").default(false).notNull(),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  });

  const policyLevelEnum = pgEnum(`${prefix}policy_level`, [
    "global",
    "role",
    "chatter",
    "conversation",
    "thread",
  ]);

  const policies = pgTable(
    `${prefix}policies`,
    {
      id: varchar("id", { length: 36 }).primaryKey(),
      level: policyLevelEnum("level").notNull(),
      scopeId: varchar("scope_id", { length: 255 }).notNull(),
      policy: jsonb("policy").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [unique().on(t.level, t.scopeId)]
  );

  return {
    chatters,
    conversations,
    participants,
    blocks,
    chatterPermissions,
    blockRegistry,
    roleRegistry,
    policies,
  };
}
