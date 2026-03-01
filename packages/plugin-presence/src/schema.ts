import type { SchemaContribution } from "@better-conversation/core/schema";

export const presenceSchemaContribution: SchemaContribution = {
  extensions: [
    {
      extendTable: "participants",
      columns: {
        lastReadAt: { type: "timestamp", nullable: true },
        lastSeenAt: { type: "timestamp", nullable: true },
        typingUntil: { type: "timestamp", nullable: true },
      },
    },
  ],
};
