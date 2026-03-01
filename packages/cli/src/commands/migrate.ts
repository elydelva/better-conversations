import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { findConfig } from "../config/findConfig.js";

export interface MigrateOptions {
  cwd: string;
  config?: string;
  yes?: boolean;
}

function run(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });
    proc.on("close", (code: number | null) => resolve(code ?? 0));
  });
}

export async function runMigrate(options: MigrateOptions): Promise<void> {
  const { cwd, config: configPath } = options;

  const found = findConfig(cwd, configPath);
  if (!found) {
    throw new Error("No conversation.ts or conv.ts found. Create one or use --config <path>");
  }

  if (existsSync(join(cwd, "drizzle.config.ts")) || existsSync(join(cwd, "drizzle.config.js"))) {
    const code = await run("bunx", ["drizzle-kit", "push"], cwd);
    if (code !== 0) throw new Error(`drizzle-kit push exited with ${code}`);
    return;
  }

  if (existsSync(join(cwd, "prisma", "schema.prisma"))) {
    const code = await run("bunx", ["prisma", "db", "push"], cwd);
    if (code !== 0) throw new Error(`prisma db push exited with ${code}`);
    return;
  }

  throw new Error("No drizzle.config or prisma/schema.prisma found. Run 'bc generate' first.");
}
