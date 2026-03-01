import { z } from "zod";

const nonEmptyString = z.string().min(1, "Must be non-empty").trim();

export const blockSendSchema = z.object({
  authorId: nonEmptyString,
  type: nonEmptyString,
  body: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  threadParentId: z.string().optional().nullable(),
});

export const blockUpdateMetaSchema = z.object({
  body: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type BlockSendInput = z.infer<typeof blockSendSchema>;
export type BlockUpdateMetaInput = z.infer<typeof blockUpdateMetaSchema>;
