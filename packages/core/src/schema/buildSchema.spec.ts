import { describe, expect, test } from "bun:test";
import { buildSchema } from "./buildSchema.js";
import type { SchemaContributor } from "./buildSchema.js";

describe("buildSchema", () => {
  test("returns base schema when no contributors", () => {
    const merged = buildSchema([], { tablePrefix: "bc_" });
    expect(merged.tables.bc_chatters).toBeDefined();
    expect(merged.tables.bc_participants).toBeDefined();
    expect(merged.tables.bc_blocks).toBeDefined();
  });

  test("includes base schema with tablePrefix", () => {
    const merged = buildSchema([], { tablePrefix: "bc_" });
    expect(merged.tables.bc_chatters).toBeDefined();
  });

  test("adds plugin schema contributions", () => {
    const plugin: SchemaContributor = {
      schemaContribution: {
        extensions: [
          {
            extendTable: "participants",
            columns: { lastReadAt: { type: "timestamp", nullable: true } },
          },
        ],
      },
    };
    const merged = buildSchema([plugin], { tablePrefix: "bc_" });
    expect(merged.tables.bc_participants.columns.lastReadAt).toBeDefined();
  });

  test("ignores contributors without schemaContribution", () => {
    const merged = buildSchema([{}], { tablePrefix: "bc_" });
    expect(merged.tables.bc_chatters).toBeDefined();
  });
});
