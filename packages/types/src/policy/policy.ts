export interface PolicyObject {
  canJoinSelf?: boolean;
  readOnly?: boolean;
  threadClosed?: boolean;
  maxParticipants?: number;

  allowedBlocks?: string[] | "*";
  deniedBlocks?: string[];
  maxBlockBodyLength?: number;
  canEditOwnBlocks?: boolean;
  canDeleteOwnBlocks?: boolean;
  editWindowSeconds?: number;

  maxBlocksPerMinute?: number;
  maxBlocksPerHour?: number;
  maxBlocksPerDay?: number;
  maxBlocksPerConversation?: number;
  sendCooldownMs?: number;

  threadsEnabled?: boolean;
  maxThreadDepth?: number;
  maxThreadReplies?: number;
}

export type ResolvedPolicy = PolicyObject;
