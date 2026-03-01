/**
 * Translates MergedSchema (core Schema Language) to Drizzle PG tables.
 * Used when buildSchema is invoked with plugins.
 */
import type { ColumnDef, MergedSchema } from "@better-conversation/core/schema";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

const TABLE_ORDER = [
  "chatters",
  "conversations",
  "participants",
  "blocks",
  "chatter_permissions",
  "block_registry",
  "role_registry",
  "policies",
  "block_history",
];

function columnDefToDrizzle(
  key: string,
  def: ColumnDef,
  tablePrefix: string,
  tableLogicalName: string
) {
  const dbName = camelToSnake(key);

  switch (def.type) {
    case "varchar": {
      const col = varchar(dbName, { length: def.length ?? 255 });
      if (def.primaryKey) return col.primaryKey();
      if (def.nullable === false) return col.notNull();
      if (def.defaultValue !== undefined && def.defaultValue !== "now")
        return col.default(def.defaultValue as string);
      return col;
    }
    case "text": {
      const col = text(dbName);
      if (def.primaryKey) return col.primaryKey();
      if (def.nullable === false) return col.notNull();
      return col;
    }
    case "integer": {
      const col = integer(dbName);
      if (def.primaryKey) return col.primaryKey();
      if (def.nullable === false) return col.notNull();
      if (def.defaultValue !== undefined) return col.default(def.defaultValue as number);
      return col;
    }
    case "boolean": {
      const col = boolean(dbName);
      if (def.nullable === false) return col.notNull();
      if (def.defaultValue === true) return col.default(true);
      if (def.defaultValue === false) return col.default(false);
      return col;
    }
    case "timestamp": {
      const col = timestamp(dbName);
      if (def.primaryKey) return col.primaryKey();
      if (def.nullable === false) return col.notNull();
      if (def.defaultValue === "now") return col.defaultNow();
      return col;
    }
    case "jsonb": {
      const col = jsonb(dbName);
      if (def.primaryKey) return col.primaryKey();
      if (def.nullable === false) return col.notNull();
      return col;
    }
    case "enum": {
      if (!def.enumValues || def.enumValues.length === 0)
        throw new Error(`Enum column ${key} missing enumValues`);
      const enumName = `${tablePrefix}${tableLogicalName}_${key}_enum`;
      const pgEnumVal = pgEnum(enumName, def.enumValues as [string, ...string[]]);
      const col = pgEnumVal(dbName);
      if (def.nullable === false) return col.notNull();
      if (def.defaultValue) return col.default(def.defaultValue as string);
      return col;
    }
    default:
      throw new Error(`Unsupported column type: ${(def as ColumnDef).type}`);
  }
}

export interface TranslateToDrizzleResult {
  chatters: ReturnType<typeof pgTable>;
  conversations: ReturnType<typeof pgTable>;
  participants: ReturnType<typeof pgTable>;
  blocks: ReturnType<typeof pgTable>;
  chatterPermissions: ReturnType<typeof pgTable>;
  blockRegistry: ReturnType<typeof pgTable>;
  roleRegistry: ReturnType<typeof pgTable>;
  policies: ReturnType<typeof pgTable>;
  blockHistory?: ReturnType<typeof pgTable>;
}

export function translateToDrizzle(
  merged: MergedSchema,
  options: { tablePrefix?: string }
): TranslateToDrizzleResult {
  const prefix = options.tablePrefix ?? "bc_";
  const result: Record<string, ReturnType<typeof pgTable>> = {};

  for (const logicalName of TABLE_ORDER) {
    const prefixedName = prefix ? `${prefix}${logicalName}` : logicalName;
    const def = merged.tables[prefixedName];
    if (!def) continue;

    const columns: Record<string, ReturnType<typeof varchar>> = {};
    for (const [key, colDef] of Object.entries(def.columns)) {
      columns[key] = columnDefToDrizzle(key, colDef, prefix, logicalName) as ReturnType<
        typeof varchar
      >;
    }

    const tableName = prefix ? `${prefix}${logicalName}` : logicalName;
    let table: ReturnType<typeof pgTable>;

    const uniqueConstraints = def.uniqueConstraints;
    if (uniqueConstraints && uniqueConstraints.length > 0) {
      table = pgTable(
        tableName,
        columns,
        (t) =>
          uniqueConstraints.flatMap((uc) => [
            unique().on(
              ...uc.columns.map(
                (c) => (t as Record<string, unknown>)[c] as ReturnType<typeof varchar>
              )
            ),
          ]) as [ReturnType<typeof unique>]
      );
    } else {
      table = pgTable(tableName, columns);
    }

    const schemaKey = logicalName.includes("_")
      ? (logicalName.replace(/_([a-z])/g, (_, c) =>
          c.toUpperCase()
        ) as keyof TranslateToDrizzleResult)
      : (logicalName as keyof TranslateToDrizzleResult);
    result[schemaKey] = table;
  }

  return result as TranslateToDrizzleResult;
}
