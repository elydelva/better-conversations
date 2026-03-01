import { z } from "zod";

const nonEmptyString = z.string().min(1, "Must be non-empty").trim();

const statusEnum = z.enum(["open", "archived", "locked"]);

export const conversationCreateSchema = z.object({
  title: z.string().optional(),
  status: statusEnum.optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  createdBy: nonEmptyString,
  metadata: z.record(z.string(), z.unknown()).optional(),
  participants: z
    .array(
      z.object({
        chatterId: nonEmptyString,
        role: nonEmptyString,
      })
    )
    .optional(),
});

export const conversationUpdateSchema = z.object({
  title: z.string().optional(),
  status: statusEnum.optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>;
export type ConversationUpdateInput = z.infer<typeof conversationUpdateSchema>;
