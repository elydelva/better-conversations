import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findConfig } from "../config/findConfig.js";
import { loadConfig } from "../config/loadConfig.js";
import { generateDrizzle } from "../generate/drizzle.js";
import { generatePrisma } from "../generate/prisma.js";

export interface GenerateOptions {
  cwd: string;
  config?: string;
  output?: string;
  yes?: boolean;
  format?: "drizzle" | "prisma";
}

function detectFormat(cwd: string): "drizzle" | "prisma" {
  if (existsSync(join(cwd, "prisma", "schema.prisma"))) {
    return "prisma";
  }
  if (existsSync(join(cwd, "drizzle.config.ts")) || existsSync(join(cwd, "drizzle.config.js"))) {
    return "drizzle";
  }
  return "drizzle";
}

function detectProvider(cwd: string): "pg" | "sqlite" {
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const raw = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      if (deps["better-sqlite3"] || deps["@libsql/client"]) return "sqlite";
    } catch {
      // ignore
    }
  }
  return "pg";
}

export async function runGenerate(options: GenerateOptions): Promise<void> {
  const { cwd, config: configPath, output, yes } = options;

  const found = findConfig(cwd, configPath);
  if (!found) {
    throw new Error("No conversation.ts or conv.ts found. Create one or use --config <path>");
  }

  const { schemaConfig } = await loadConfig(found);
  const format = options.format ?? detectFormat(cwd);
  const provider = detectProvider(cwd);

  const defaultOutput =
    format === "prisma" ? join(cwd, "prisma", "bc-schema.prisma") : join(cwd, "schema.ts");
  const outputPath = output ? join(cwd, output) : defaultOutput;

  if (!yes) {
    console.log(`Generating ${format} schema to ${outputPath}`);
  }

  if (format === "prisma") {
    generatePrisma({
      ...schemaConfig,
      outputPath,
    });
  } else {
    generateDrizzle({
      ...schemaConfig,
      outputPath,
      provider,
    });
  }

  console.log(`Schema written to ${outputPath}`);
}
