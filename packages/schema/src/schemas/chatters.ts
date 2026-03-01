import { z } from "zod";

const nonEmptyString = z.string().min(1, "Must be non-empty").trim();

export const chatterCreateSchema = z.object({
  displayName: nonEmptyString,
  entityType: nonEmptyString,
  entityId: z.string().trim().optional(),
  avatarUrl: z.string().optional().nullable(),
});

export const chatterUpdateSchema = z.object({
  displayName: z.string().min(1).trim().optional(),
  avatarUrl: z.string().url().optional(),
  entityType: z.string().min(1).trim().optional(),
  entityId: z.string().optional(),
});

export type ChatterCreateInput = z.infer<typeof chatterCreateSchema>;
export type ChatterUpdateInput = z.infer<typeof chatterUpdateSchema>;
