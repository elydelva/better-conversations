import { z } from "zod";

const nonEmptyString = z.string().min(1, "Must be non-empty").trim();

export const participantAddSchema = z.object({
  chatterId: nonEmptyString,
  role: nonEmptyString,
});

export const participantSetRoleSchema = z.object({
  role: nonEmptyString,
});

export type ParticipantAddInput = z.infer<typeof participantAddSchema>;
export type ParticipantSetRoleInput = z.infer<typeof participantSetRoleSchema>;
