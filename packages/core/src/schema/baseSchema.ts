import type { SchemaContribution } from "./SchemaLanguage.js";

export const baseSchemaContribution: SchemaContribution = {
  tables: [
    {
      name: "chatters",
      columns: {
        id: { type: "varchar", length: 36, primaryKey: true, nullable: false },
        displayName: { type: "varchar", length: 255, nullable: false },
        avatarUrl: { type: "text", nullable: true },
        entityType: { type: "varchar", length: 64, nullable: false },
        entityId: { type: "varchar", length: 255, nullable: true },
        metadata: { type: "jsonb", nullable: true },
        isActive: { type: "boolean", nullable: false, defaultValue: true },
        createdAt: { type: "timestamp", nullable: false, defaultValue: "now" },
        updatedAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
    },
    {
      name: "conversations",
      columns: {
        id: { type: "varchar", length: 36, primaryKey: true, nullable: false },
        title: { type: "varchar", length: 255, nullable: true },
        status: {
          type: "enum",
          enumValues: ["open", "archived", "locked"],
          nullable: false,
          defaultValue: "open",
        },
        entityType: { type: "varchar", length: 64, nullable: true },
        entityId: { type: "varchar", length: 255, nullable: true },
        createdBy: { type: "varchar", length: 36, nullable: false },
        metadata: { type: "jsonb", nullable: true },
        createdAt: { type: "timestamp", nullable: false, defaultValue: "now" },
        updatedAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
      relations: [
        {
          type: "references",
          column: "createdBy",
          referencedTable: "chatters",
          referencedColumn: "id",
        },
      ],
    },
    {
      name: "participants",
      columns: {
        id: { type: "varchar", length: 36, primaryKey: true, nullable: false },
        conversationId: { type: "varchar", length: 36, nullable: false },
        chatterId: { type: "varchar", length: 36, nullable: false },
        role: { type: "varchar", length: 64, nullable: false },
        joinedAt: { type: "timestamp", nullable: false, defaultValue: "now" },
        leftAt: { type: "timestamp", nullable: true },
        metadata: { type: "jsonb", nullable: true },
      },
      relations: [
        {
          type: "references",
          column: "conversationId",
          referencedTable: "conversations",
          referencedColumn: "id",
        },
        {
          type: "references",
          column: "chatterId",
          referencedTable: "chatters",
          referencedColumn: "id",
        },
      ],
      uniqueConstraints: [{ columns: ["conversationId", "chatterId"] }],
    },
    {
      name: "blocks",
      columns: {
        id: { type: "varchar", length: 36, primaryKey: true, nullable: false },
        conversationId: { type: "varchar", length: 36, nullable: false },
        authorId: { type: "varchar", length: 36, nullable: false },
        type: { type: "varchar", length: 128, nullable: false },
        body: { type: "text", nullable: true },
        metadata: { type: "jsonb", nullable: true },
        threadParentId: { type: "varchar", length: 36, nullable: true },
        status: {
          type: "enum",
          enumValues: ["published", "pending_review", "refused", "deleted"],
          nullable: false,
          defaultValue: "published",
        },
        refusalReason: { type: "text", nullable: true },
        flaggedAt: { type: "timestamp", nullable: true },
        editedAt: { type: "timestamp", nullable: true },
        createdAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
      relations: [
        {
          type: "references",
          column: "conversationId",
          referencedTable: "conversations",
          referencedColumn: "id",
        },
        {
          type: "references",
          column: "authorId",
          referencedTable: "chatters",
          referencedColumn: "id",
        },
        {
          type: "references",
          column: "threadParentId",
          referencedTable: "blocks",
          referencedColumn: "id",
        },
      ],
    },
    {
      name: "chatter_permissions",
      columns: {
        id: { type: "varchar", length: 36, primaryKey: true, nullable: false },
        chatterId: { type: "varchar", length: 36, nullable: false },
        action: { type: "varchar", length: 128, nullable: false },
        scope: { type: "varchar", length: 255, nullable: true },
        granted: { type: "boolean", nullable: false, defaultValue: true },
      },
      relations: [
        {
          type: "references",
          column: "chatterId",
          referencedTable: "chatters",
          referencedColumn: "id",
        },
      ],
    },
    {
      name: "block_registry",
      columns: {
        type: { type: "varchar", length: 128, primaryKey: true, nullable: false },
        schemaJson: { type: "jsonb", nullable: false },
        isBuiltIn: { type: "boolean", nullable: false, defaultValue: false },
        registeredAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
    },
    {
      name: "role_registry",
      columns: {
        name: { type: "varchar", length: 64, primaryKey: true, nullable: false },
        extends: { type: "varchar", length: 64, nullable: true },
        policy: { type: "jsonb", nullable: false },
        isBuiltIn: { type: "boolean", nullable: false, defaultValue: false },
        registeredAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
    },
    {
      name: "policies",
      columns: {
        id: { type: "varchar", length: 36, primaryKey: true, nullable: false },
        level: {
          type: "enum",
          enumValues: ["global", "role", "chatter", "conversation", "thread"],
          nullable: false,
        },
        scopeId: { type: "varchar", length: 255, nullable: false },
        policy: { type: "jsonb", nullable: false },
        createdAt: { type: "timestamp", nullable: false, defaultValue: "now" },
        updatedAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
      uniqueConstraints: [{ columns: ["level", "scopeId"] }],
    },
  ],
};
