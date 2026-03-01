import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

const prefix = "bc_";

export const chatters = sqliteTable(`${prefix}chatters`, {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: text("metadata", { mode: "json" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const conversations = sqliteTable(`${prefix}conversations`, {
  id: text("id").primaryKey(),
  title: text("title"),
  status: text("status").notNull().default("open"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  createdBy: text("created_by").notNull(),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const participants = sqliteTable(`${prefix}participants`, {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  chatterId: text("chatter_id")
    .notNull()
    .references(() => chatters.id),
  role: text("role").notNull(),
  joinedAt: integer("joined_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  leftAt: integer("left_at", { mode: "timestamp" }),
  lastReadAt: integer("last_read_at", { mode: "timestamp" }),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
  typingUntil: integer("typing_until", { mode: "timestamp" }),
  metadata: text("metadata", { mode: "json" }),
});

export const blocks = sqliteTable(`${prefix}blocks`, {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  authorId: text("author_id")
    .notNull()
    .references(() => chatters.id),
  type: text("type").notNull(),
  body: text("body"),
  metadata: text("metadata", { mode: "json" }),
  threadParentId: text("thread_parent_id"),
  status: text("status").notNull().default("published"),
  refusalReason: text("refusal_reason"),
  flaggedAt: integer("flagged_at", { mode: "timestamp" }),
  editedAt: integer("edited_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const blockHistory = sqliteTable(`${prefix}block_history`, {
  id: text("id").primaryKey(),
  blockId: text("block_id")
    .notNull()
    .references(() => blocks.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  body: text("body"),
  metadata: text("metadata", { mode: "json" }),
  editedAt: integer("edited_at", { mode: "timestamp" }).notNull(),
  editedBy: text("edited_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const chatterPermissions = sqliteTable(`${prefix}chatter_permissions`, {
  id: text("id").primaryKey(),
  chatterId: text("chatter_id")
    .notNull()
    .references(() => chatters.id),
  action: text("action").notNull(),
  scope: text("scope"),
  granted: integer("granted", { mode: "boolean" }).default(true).notNull(),
});

export const blockRegistry = sqliteTable(`${prefix}block_registry`, {
  type: text("type").primaryKey(),
  schemaJson: text("schema_json", { mode: "json" }).notNull(),
  isBuiltIn: integer("is_built_in", { mode: "boolean" }).default(false).notNull(),
  registeredAt: integer("registered_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const roleRegistry = sqliteTable(`${prefix}role_registry`, {
  name: text("name").primaryKey(),
  extends: text("extends"),
  policy: text("policy", { mode: "json" }).notNull(),
  isBuiltIn: integer("is_built_in", { mode: "boolean" }).default(false).notNull(),
  registeredAt: integer("registered_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const policies = sqliteTable(
  `${prefix}policies`,
  {
    id: text("id").primaryKey(),
    level: text("level").notNull(),
    scopeId: text("scope_id").notNull(),
    policy: text("policy", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [unique("policies_level_scope_unique").on(t.level, t.scopeId)]
);
