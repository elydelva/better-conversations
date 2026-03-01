import type { Chatter } from "../types/index.js";
import type { HookResult, RefuseOptions } from "./common.js";

export interface ConversationCreateData {
  title?: string | null;
  status?: string;
  entityType?: string | null;
  entityId?: string | null;
  createdBy: string;
  metadata?: Record<string, unknown> | null;
  participants?: Array<{ chatterId: string; role: string }>;
}

export interface ConversationCreateCtx {
  data: ConversationCreateData;
  createdBy: Chatter;
}

export interface ConversationOutcomes {
  next: () => Promise<HookResult>;
  refuse: (reason: string, opts?: RefuseOptions) => Promise<HookResult>;
  transform: (data: Partial<ConversationCreateData>) => Promise<HookResult>;
}
