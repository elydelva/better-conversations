import type { BlockAfterSendCtx } from "./BlockAfterSend.js";
import type { BlockBeforeSendCtx, BlockOutcomes } from "./BlockBeforeSend.js";
import type { BlockDeleteCtx, DeleteOutcomes } from "./BlockDelete.js";
import type { BlockAfterUpdateCtx, BlockBeforeUpdateCtx } from "./BlockUpdate.js";
import type { ConversationAfterCreateCtx } from "./ConversationAfterCreate.js";
import type { ConversationCreateCtx, ConversationOutcomes } from "./ConversationCreate.js";
import type { StatusChangeCtx, StatusOutcomes } from "./ConversationStatusChange.js";
import type { ParticipantJoinCtx, ParticipantOutcomes } from "./ParticipantJoin.js";
import type { ParticipantLeaveCtx } from "./ParticipantLeave.js";
import type { ThreadCreatedCtx } from "./ThreadCreated.js";
import type { HookResult } from "./common.js";

export type { RefuseOptions, HookResult } from "./common.js";

export interface ConversationHooks<
  TBlocks extends Record<string, unknown> = Record<string, unknown>,
  TRoles extends Record<string, unknown> = Record<string, unknown>,
> {
  onBlockBeforeSend?: (ctx: BlockBeforeSendCtx, outcomes: BlockOutcomes) => Promise<HookResult>;
  onBlockAfterSend?: (ctx: BlockAfterSendCtx) => Promise<void>;
  onBlockBeforeDelete?: (ctx: BlockDeleteCtx, outcomes: DeleteOutcomes) => Promise<HookResult>;
  onBlockBeforeUpdate?: (ctx: BlockBeforeUpdateCtx) => Promise<void>;
  onBlockAfterUpdate?: (ctx: BlockAfterUpdateCtx) => Promise<void>;

  onConversationBeforeCreate?: (
    ctx: ConversationCreateCtx,
    outcomes: ConversationOutcomes
  ) => Promise<HookResult>;
  onConversationAfterCreate?: (ctx: ConversationAfterCreateCtx) => Promise<void>;
  onConversationStatusChange?: (
    ctx: StatusChangeCtx,
    outcomes: StatusOutcomes
  ) => Promise<HookResult>;

  onParticipantBeforeJoin?: (
    ctx: ParticipantJoinCtx,
    outcomes: ParticipantOutcomes
  ) => Promise<HookResult>;
  onParticipantAfterJoin?: (ctx: ParticipantJoinCtx) => Promise<void>;
  onParticipantBeforeLeave?: (
    ctx: ParticipantLeaveCtx,
    outcomes: ParticipantOutcomes
  ) => Promise<HookResult>;

  onThreadCreated?: (ctx: ThreadCreatedCtx, outcomes: BlockOutcomes) => Promise<HookResult>;
}
