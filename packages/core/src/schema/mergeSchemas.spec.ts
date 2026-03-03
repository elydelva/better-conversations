import { describe, expect, test } from "bun:test";
import type { SchemaContribution } from "@better-agnostic/schema";
import { mergeSchemas } from "@better-agnostic/schema";

describe("mergeSchemas", () => {
  test("merges tables from multiple contributions", () => {
    const c1: SchemaContribution = {
      tables: [{ name: "a", columns: { id: { type: "varchar", length: 36, primaryKey: true } } }],
    };
    const c2: SchemaContribution = {
      tables: [{ name: "b", columns: { id: { type: "varchar", length: 36, primaryKey: true } } }],
    };
    const merged = mergeSchemas([c1, c2]);
    expect(merged.tables.a).toBeDefined();
    expect(merged.tables.b).toBeDefined();
  });

  test("applies tablePrefix to table names", () => {
    const c: SchemaContribution = {
      tables: [{ name: "users", columns: { id: { type: "varchar", length: 36 } } }],
    };
    const merged = mergeSchemas([c], { tablePrefix: "bc_" });
    expect(merged.tables.bc_users).toBeDefined();
    expect(merged.tables.bc_users.name).toBe("bc_users");
  });

  test("extensions add columns to existing tables", () => {
    const base: SchemaContribution = {
      tables: [
        {
          name: "participants",
          columns: {
            id: { type: "varchar", length: 36, primaryKey: true },
            role: { type: "varchar", length: 64 },
          },
        },
      ],
    };
    const presence: SchemaContribution = {
      extensions: [
        {
          extendTable: "participants",
          columns: { lastReadAt: { type: "timestamp", nullable: true } },
        },
      ],
    };
    const merged = mergeSchemas([base, presence], { tablePrefix: "bc_" });
    const table = merged.tables.bc_participants;
    expect(table.columns.id).toBeDefined();
    expect(table.columns.role).toBeDefined();
    expect(table.columns.lastReadAt).toEqual({ type: "timestamp", nullable: true });
  });

  test("throws when extending unknown table", () => {
    const ext: SchemaContribution = {
      extensions: [{ extendTable: "nonexistent", columns: { x: { type: "integer" } } }],
    };
    expect(() => mergeSchemas([ext], { tablePrefix: "bc_" })).toThrow(
      "Cannot extend unknown table"
    );
  });
});
