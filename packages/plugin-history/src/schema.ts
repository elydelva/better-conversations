import type { SchemaContribution } from "@better-conversation/core/schema";

export const historySchemaContribution: SchemaContribution = {
  tables: [
    {
      name: "block_history",
      columns: {
        id: { type: "varchar", length: 36, primaryKey: true, nullable: false },
        blockId: { type: "varchar", length: 36, nullable: false },
        version: { type: "integer", nullable: false },
        body: { type: "text", nullable: true },
        metadata: { type: "jsonb", nullable: true },
        editedAt: { type: "timestamp", nullable: false },
        editedBy: { type: "varchar", length: 36, nullable: true },
        createdAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
      relations: [
        {
          type: "references",
          column: "blockId",
          referencedTable: "blocks",
          referencedColumn: "id",
          onDelete: "cascade",
        },
      ],
    },
  ],
};
