/**
 * Schema Language — format objet canonique pour décrire un schéma DB.
 * Agnostique de tout ORM (Drizzle, Prisma, Mongo).
 * Les adapters traduisent MergedSchema en structures natives.
 */

export type ColumnType =
  | "varchar"
  | "text"
  | "integer"
  | "bigint"
  | "boolean"
  | "timestamp"
  | "date"
  | "jsonb"
  | "json"
  | "enum";

export interface ColumnDef {
  type: ColumnType;
  length?: number;
  nullable?: boolean;
  defaultValue?: unknown;
  primaryKey?: boolean;
  unique?: boolean;
  enumValues?: string[];
}

export interface RelationDef {
  type: "references";
  column: string;
  referencedTable: string;
  referencedColumn?: string;
  onDelete?: "cascade" | "setNull" | "restrict" | "noAction";
  onUpdate?: "cascade" | "restrict" | "noAction";
}

export interface TableDef {
  name: string;
  columns: Record<string, ColumnDef>;
  relations?: RelationDef[];
  uniqueConstraints?: Array<{ columns: string[] }>;
}

export interface TableExtension {
  extendTable: string;
  columns: Record<string, ColumnDef>;
}

export interface SchemaContribution {
  tables?: TableDef[];
  extensions?: TableExtension[];
}

export interface MergedSchema {
  tables: Record<string, TableDef>;
}
