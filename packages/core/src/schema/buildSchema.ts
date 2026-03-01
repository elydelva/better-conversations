import type { MergedSchema, SchemaContribution } from "./SchemaLanguage.js";
import { baseSchemaContribution } from "./baseSchema.js";
import { mergeSchemas } from "./mergeSchemas.js";

export interface BuildSchemaOptions {
  tablePrefix?: string;
}

/** Plugin-like object that may provide a schema contribution */
export interface SchemaContributor {
  schemaContribution?: SchemaContribution;
}

/**
 * Builds the final merged schema from base + plugin contributions.
 * @param contributors - Array of plugins or objects with schemaContribution
 * @param options - tablePrefix (e.g. "bc_")
 */
export function buildSchema(
  contributors: SchemaContributor[],
  options?: BuildSchemaOptions
): MergedSchema {
  const contributions: SchemaContribution[] = [baseSchemaContribution];
  for (const c of contributors) {
    if (c.schemaContribution) {
      contributions.push(c.schemaContribution);
    }
  }
  return mergeSchemas(contributions, options);
}
