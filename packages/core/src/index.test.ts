import { expect, test } from "bun:test";
import { version } from "./index";

test("core exports version", () => {
  expect(version).toBe("0.0.0");
});
