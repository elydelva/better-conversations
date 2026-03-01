import type {
  MergedSchema,
  SchemaContribution,
  TableDef,
  TableExtension,
} from "./SchemaLanguage.js";

export interface MergeSchemasOptions {
  tablePrefix?: string;
}

/**
 * Merges schema contributions into a single MergedSchema.
 * Tables are prefixed. Extensions add columns to existing tables.
 */
export function mergeSchemas(
  contributions: SchemaContribution[],
  options?: MergeSchemasOptions
): MergedSchema {
  const tables: Record<string, TableDef> = {};
  const prefix = options?.tablePrefix ?? "";

  for (const contrib of contributions) {
    for (const table of contrib.tables ?? []) {
      const prefixedName = prefix ? `${prefix}${table.name}` : table.name;
      tables[prefixedName] = { ...table, name: prefixedName };
    }
  }

  for (const contrib of contributions) {
    for (const ext of contrib.extensions ?? []) {
      const tableName = prefix ? `${prefix}${ext.extendTable}` : ext.extendTable;
      const existing = tables[tableName];
      if (!existing) {
        throw new Error(`Cannot extend unknown table: ${ext.extendTable} (resolved: ${tableName})`);
      }
      tables[tableName] = {
        ...existing,
        columns: { ...existing.columns, ...ext.columns },
      };
    }
  }

  return { tables };
}
