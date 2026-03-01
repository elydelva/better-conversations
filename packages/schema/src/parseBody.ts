import { ValidationError } from "@better-conversation/errors";
import type { ZodType } from "zod";
import type { CoreRequest } from "./types.js";

/**
 * Parses and validates request body against a Zod schema.
 * Throws ValidationError (with issues) on failure.
 */
export function parseBody<T>(req: CoreRequest, schema: ZodType<T>): T {
  const raw = req.body;
  if (raw === null || raw === undefined) {
    throw new ValidationError("Request body is required", {
      metadata: { issues: [{ message: "Body is null or undefined" }] },
    });
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError("Request body must be an object", {
      metadata: { issues: [{ message: "Expected object" }] },
    });
  }

  const result = schema.safeParse(raw);
  if (result.success) {
    return result.data as T;
  }

  const zodError = result.error;
  const issues = zodError.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  throw new ValidationError(zodError.message, {
    metadata: { issues },
  });
}
