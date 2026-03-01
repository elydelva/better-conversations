import type { BlockDefinition } from "../registry/index.js";
import type { CreateBlockOptions } from "./interface.js";

export function createBlock<TType extends string>(
  options: CreateBlockOptions<TType>
): BlockDefinition {
  return {
    type: options.type,
    schema: options.schema,
    hooks: options.hooks,
  };
}
