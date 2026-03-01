import { describe, expect, test } from "bun:test";
import { betterConversation, dispatch } from "@better-conversation/core";
import { createMockAdapter } from "@better-conversation/core/fixtures";
import { historyPlugin } from "./index.js";

describe("plugin-history", () => {
  test("historyPlugin exposes name, schemaContribution, createServices, hooks", () => {
    expect(historyPlugin.name).toBe("history");
    expect(historyPlugin.schemaContribution).toBeDefined();
    expect(historyPlugin.schemaContribution?.tables?.[0]?.name).toBe("block_history");
    expect(historyPlugin.createServices).toBeDefined();
    expect(historyPlugin.hooks?.onBlockAfterUpdate).toBeDefined();
    expect(historyPlugin.routes?.length).toBeGreaterThanOrEqual(1);
  });

  test("createServices throws when adapter has no history extension", () => {
    const adapter = createMockAdapter();
    expect(() => betterConversation({ adapter, plugins: [historyPlugin] })).toThrow(
      /history extension/
    );
  });
});
