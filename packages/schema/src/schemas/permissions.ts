import { z } from "zod";

const nonEmptyString = z.string().min(1, "Must be non-empty").trim();

export const permissionGrantSchema = z.object({
  action: nonEmptyString,
  scope: z.string().optional(),
});

export type PermissionGrantInput = z.infer<typeof permissionGrantSchema>;
