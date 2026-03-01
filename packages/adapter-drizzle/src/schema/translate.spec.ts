import { describe, expect, test } from "bun:test";
import { buildSchema } from "@better-conversation/core/schema";
import { translateToDrizzle } from "./translate.js";

describe("translateToDrizzle", () => {
  test("translates base schema to Drizzle tables", () => {
    const merged = buildSchema([], { tablePrefix: "bc_" });
    const result = translateToDrizzle(merged, { tablePrefix: "bc_" });
    expect(result.chatters).toBeDefined();
    expect(result.conversations).toBeDefined();
    expect(result.participants).toBeDefined();
    expect(result.blocks).toBeDefined();
    expect(result.policies).toBeDefined();
  });

  test("translates schema with plugin extension", () => {
    const plugin = {
      schemaContribution: {
        extensions: [
          {
            extendTable: "participants",
            columns: {
              lastReadAt: { type: "timestamp" as const, nullable: true },
            },
          },
        ],
      },
    };
    const merged = buildSchema([plugin], { tablePrefix: "bc_" });
    const result = translateToDrizzle(merged, { tablePrefix: "bc_" });
    expect(result.participants).toBeDefined();
    expect(result.chatters).toBeDefined();
  });
});
