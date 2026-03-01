import { describe, expect, test } from "bun:test";
import {
  type SecurityConfig,
  getDefaultSecurityConfig,
  mergeSecurityConfig,
} from "./SecurityConfig.interface.js";

describe("SecurityConfig", () => {
  test("getDefaultSecurityConfig returns restrictive defaults", () => {
    const config = getDefaultSecurityConfig();
    expect(config.requireAuth).toBe(true);
    expect(config.participantAccessControl).toBe(true);
    expect(config.allowListChatters).toBe(false);
    expect(config.allowListConversations).toBe(false);
    expect(config.archiveRequiresPermission).toBe(true);
    expect(config.addParticipantRequiresRole).toBe(true);
    expect(config.removeParticipantRequiresRole).toBe(true);
    expect(config.setRoleRequiresAdmin).toBe(true);
    expect(config.grantRevokePermissionsRequiresAdmin).toBe(true);
    expect(config.policyWriteRequiresAdmin).toBe(true);
  });

  test("mergeSecurityConfig with empty partial returns defaults", () => {
    const merged = mergeSecurityConfig({});
    expect(merged.requireAuth).toBe(true);
    expect(merged.allowListChatters).toBe(false);
  });

  test("mergeSecurityConfig with partial overrides defaults", () => {
    const partial: Partial<SecurityConfig> = {
      requireAuth: false,
      allowListChatters: true,
    };
    const merged = mergeSecurityConfig(partial);
    expect(merged.requireAuth).toBe(false);
    expect(merged.allowListChatters).toBe(true);
    expect(merged.allowListConversations).toBe(false); // unchanged
  });

  test("mergeSecurityConfig with null/undefined returns defaults", () => {
    expect(mergeSecurityConfig(null).requireAuth).toBe(true);
    expect(mergeSecurityConfig(undefined).requireAuth).toBe(true);
  });
});
