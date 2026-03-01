import { pathToFileURL } from "node:url";
import type { ConversationEngine } from "@better-conversation/core";
import type { SchemaContributor } from "@better-conversation/core/schema";
import type { FindConfigResult } from "./findConfig.js";

export interface LoadedSchemaConfig {
  tablePrefix: string;
  contributors: SchemaContributor[];
}

export interface LoadConfigResult {
  schemaConfig: LoadedSchemaConfig;
  configPath: string;
}

/**
 * Dynamically imports the config file and extracts schema config from the engine.
 */
export async function loadConfig(result: FindConfigResult): Promise<LoadConfigResult> {
  const url = pathToFileURL(result.path).href;
  const mod = await import(url);

  // Prefer sync exports (conv, conversation) - getEngine may require DB connection
  const engine: ConversationEngine | (() => Promise<ConversationEngine>) | undefined =
    mod.conv ?? mod.conversation ?? mod.default ?? mod.getEngine;

  if (!engine) {
    throw new Error(
      `Config file ${result.path} must export conv, conversation, or getEngine. For CLI, export the engine instance: export { conv }`
    );
  }

  const resolved = typeof engine === "function" ? await engine() : engine;
  const schemaConfig = resolved.getSchemaConfigForCLI();

  return {
    schemaConfig,
    configPath: result.path,
  };
}
