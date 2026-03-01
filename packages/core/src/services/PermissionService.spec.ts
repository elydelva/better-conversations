import { describe, expect, test } from "bun:test";
import { createMockAdapter } from "../fixtures/index.js";
import { PermissionService } from "./PermissionService.js";

describe("PermissionService", () => {
  test("check delegates to adapter", async () => {
    const permissions = {
      check: async () => true,
      grant: async () => {},
      revoke: async () => {},
    };
    const adapter = createMockAdapter({ permissions });
    const service = new PermissionService(adapter.permissions);

    const result = await service.check("chatter_1", "write", "conv_1");
    expect(result).toBe(true);
  });

  test("grant delegates to adapter", async () => {
    let grantedAction: string | null = null;
    const permissions = {
      check: async () => false,
      grant: async (chatterId: string, action: string) => {
        grantedAction = action;
      },
      revoke: async () => {},
    };
    const adapter = createMockAdapter({ permissions });
    const service = new PermissionService(adapter.permissions);

    await service.grant("chatter_1", "write", "conv_1");
    expect(grantedAction).toBe("write");
  });

  test("revoke delegates to adapter", async () => {
    let revokedAction: string | null = null;
    const permissions = {
      check: async () => false,
      grant: async () => {},
      revoke: async (chatterId: string, action: string) => {
        revokedAction = action;
      },
    };
    const adapter = createMockAdapter({ permissions });
    const service = new PermissionService(adapter.permissions);

    await service.revoke("chatter_1", "write", "conv_1");
    expect(revokedAction).toBe("write");
  });
});
