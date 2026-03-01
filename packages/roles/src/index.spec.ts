import { describe, expect, test } from "bun:test";
import * as roles from "./index.js";

describe("roles", () => {
  test("exports moderator role", () => {
    expect(roles.moderatorRole).toBeDefined();
    expect(typeof roles.moderatorRole).toBe("string");
  });

  test("exports admin role", () => {
    expect(roles.adminRole).toBeDefined();
    expect(typeof roles.adminRole).toBe("string");
  });

  test("exports guest role", () => {
    expect(roles.guestRole).toBeDefined();
    expect(typeof roles.guestRole).toBe("string");
  });

  test("exports support role", () => {
    expect(roles.supportRole).toBeDefined();
    expect(typeof roles.supportRole).toBe("string");
  });
});
