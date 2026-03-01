import { z } from "zod";

/**
 * Policy object schema - permissive to allow extension.
 * Known PolicyObject fields as optional; extra keys allowed.
 */
export const policySetSchema = z
  .object({
    canJoinSelf: z.boolean().optional(),
    readOnly: z.boolean().optional(),
    threadClosed: z.boolean().optional(),
    maxParticipants: z.number().int().positive().optional(),
    allowedBlocks: z.union([z.array(z.string()), z.literal("*")]).optional(),
    deniedBlocks: z.array(z.string()).optional(),
    maxBlockBodyLength: z.number().int().positive().optional(),
    canEditOwnBlocks: z.boolean().optional(),
    canDeleteOwnBlocks: z.boolean().optional(),
    editWindowSeconds: z.number().int().nonnegative().optional(),
    maxBlocksPerMinute: z.number().int().positive().optional(),
    maxBlocksPerHour: z.number().int().positive().optional(),
    maxBlocksPerDay: z.number().int().positive().optional(),
    maxBlocksPerConversation: z.number().int().positive().optional(),
    sendCooldownMs: z.number().int().nonnegative().optional(),
    threadsEnabled: z.boolean().optional(),
    maxThreadDepth: z.number().int().positive().optional(),
    maxThreadReplies: z.number().int().positive().optional(),
  })
  .passthrough();

export type PolicySetInput = z.infer<typeof policySetSchema>;
