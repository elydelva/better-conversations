import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findConfig } from "./findConfig.js";

test("findConfig returns null when no config exists", () => {
  const dir = mkdtempSync(join(tmpdir(), "bc-cli-"));
  try {
    expect(findConfig(dir)).toBeNull();
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("findConfig finds conversation.ts in root", () => {
  const dir = mkdtempSync(join(tmpdir(), "bc-cli-"));
  try {
    writeFileSync(join(dir, "conversation.ts"), "export const conv = {}");
    const found = findConfig(dir);
    expect(found).not.toBeNull();
    expect(found?.path).toContain("conversation.ts");
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("findConfig finds conv.ts in lib", () => {
  const dir = mkdtempSync(join(tmpdir(), "bc-cli-"));
  try {
    mkdirSync(join(dir, "lib"), { recursive: true });
    writeFileSync(join(dir, "lib", "conv.ts"), "export const conv = {}");
    const found = findConfig(dir);
    expect(found).not.toBeNull();
    expect(found?.path).toContain("conv.ts");
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("findConfig uses custom path when provided", () => {
  const dir = mkdtempSync(join(tmpdir(), "bc-cli-"));
  try {
    mkdirSync(join(dir, "custom"), { recursive: true });
    writeFileSync(join(dir, "custom", "my-conv.ts"), "export const conv = {}");
    const found = findConfig(dir, "custom/my-conv.ts");
    expect(found).not.toBeNull();
    expect(found?.path).toContain("my-conv.ts");
  } finally {
    rmSync(dir, { recursive: true });
  }
});
