import { ValidationError } from "@better-conversation/errors";
import { z } from "zod";

export const typingBodySchema = z.object({
  until: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v != null ? Number.parseInt(String(v), 10) : 5000)),
});

export type TypingBodyInput = z.infer<typeof typingBodySchema>;

/** Parses and validates typing body. Returns untilMs (1-30000). */
export function parseTypingBody(body: unknown): { untilMs: number } {
  const raw = body ?? {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError("Body must be an object", {
      metadata: { issues: [{ message: "Expected object" }] },
    });
  }
  const result = typingBodySchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    }));
    throw new ValidationError(result.error.message, { metadata: { issues } });
  }
  const rawUntil = result.data.until ?? 5000;
  if (!Number.isFinite(rawUntil)) {
    throw new ValidationError("until must be a valid number between 1 and 30000", {
      metadata: { issues: [{ message: "Invalid number", path: "until" }] },
    });
  }
  const untilMs = Math.min(Math.max(rawUntil, 1), 30000);
  return { untilMs };
}
