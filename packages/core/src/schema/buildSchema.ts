import {
  type BuildSchemaOptions,
  type MergedSchema,
  type SchemaContributor,
  buildSchema as buildSchemaAgnostic,
} from "@better-agnostic/schema";
import { baseSchemaContribution } from "./baseSchema.js";

export type { BuildSchemaOptions, SchemaContributor };

/**
 * Builds the final merged schema from base + plugin contributions.
 * Uses baseSchemaContribution (conversation tables) as first contributor.
 * @param contributors - Array of plugins or objects with schemaContribution
 * @param options - tablePrefix (e.g. "bc_")
 */
export function buildSchema(
  contributors: SchemaContributor[],
  options?: BuildSchemaOptions
): MergedSchema {
  const baseContributor: SchemaContributor = { schemaContribution: baseSchemaContribution };
  return buildSchemaAgnostic([baseContributor, ...contributors], options);
}
