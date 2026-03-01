#!/usr/bin/env node

import { resolve } from "node:path";
import { cac } from "cac";
import { runGenerate } from "./commands/generate.js";
import { runMigrate } from "./commands/migrate.js";
import { findConfig } from "./config/findConfig.js";

const cli = cac("bc");

const cwd = process.cwd();

cli
  .command("generate", "Generate schema (Drizzle or Prisma)")
  .option("--config <path>", "Path to conversation config file")
  .option("--output <path>", "Output file path")
  .option("--yes", "Skip confirmation")
  .option("--format <drizzle|prisma>", "Output format (auto-detected if omitted)")
  .action(async (options) => {
    try {
      await runGenerate({
        cwd,
        config: options.config,
        output: options.output,
        yes: options.yes,
        format: options.format,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

cli
  .command("migrate", "Apply schema to database (drizzle-kit push or prisma db push)")
  .option("--config <path>", "Path to conversation config file")
  .option("--yes", "Skip confirmation")
  .action(async (options) => {
    try {
      await runMigrate({
        cwd,
        config: options.config,
        yes: options.yes,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

cli
  .command("info", "Show config location and schema info")
  .option("--config <path>", "Path to conversation config file")
  .action(async (options) => {
    const configPath = options.config ? resolve(cwd, options.config) : undefined;
    const found = findConfig(cwd, configPath ?? undefined);
    if (!found) {
      console.log("No conversation.ts or conv.ts found.");
      process.exit(1);
    }
    console.log("Config:", found.path);
  });

cli.help();
cli.parse();
