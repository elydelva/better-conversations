import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findConfig } from "../config/findConfig.js";
import { runGenerate } from "./generate.js";

test("runGenerate creates schema.ts with base schema when no plugins", async () => {
  const dir = join(import.meta.dir, "../../test-fixtures");
  const found = findConfig(dir, "conversation.ts");
  if (!found) throw new Error("Fixture not found");

  const outDir = mkdtempSync(join(tmpdir(), "bc-gen-"));

  try {
    await runGenerate({
      cwd: dir,
      config: "conversation.ts",
      output: "schema.ts",
      yes: true,
    });

    const outputPath = join(dir, "schema.ts");
    const content = readFileSync(outputPath, "utf-8");
    expect(content).toContain("buildSchema");
    expect(content).toContain("translateToDrizzle");
    expect(content).toContain('tablePrefix: "bc_"');
  } finally {
    try {
      rmSync(join(dir, "schema.ts"), { force: true });
    } catch {
      // ignore
    }
  }
});
