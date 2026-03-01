export const version = "0.0.0";

export { betterConversation } from "./factory.js";
export { ConversationEngine } from "./engine.js";

export { createBlock } from "./block/index.js";
export { createRole } from "./role/index.js";

export type {
  Chatter,
  ChatterInput,
  Conversation,
  ConversationInput,
  Participant,
  ParticipantInput,
  Block,
  BlockInput,
  Paginated,
  ConversationFilters,
  BlockFilters,
  BlockStatus,
  ConversationStatus,
} from "./types/index.js";

export { createAdapterHelpers } from "./adapter/index.js";
export type {
  AdapterOptions,
  DatabaseAdapter,
  ChatterAdapter,
  ConversationAdapter,
  ParticipantAdapter,
  BlockAdapter,
  PermissionAdapter,
} from "./adapter/index.js";

export type { ConversationConfig, ConversationPlugin } from "./config/index.js";

export type {
  PolicyObject,
  PolicyConfig,
  ResolvedPolicy,
  MergeStrategy,
  PolicyResolveContext,
} from "./policy/index.js";

export type {
  ConversationHooks,
  BlockBeforeSendCtx,
  BlockAfterSendCtx,
  BlockDeleteCtx,
  BlockOutcomes,
  DeleteOutcomes,
  HookResult,
  RefuseOptions,
  ConversationCreateCtx,
  ConversationAfterCreateCtx,
  StatusChangeCtx,
  ConversationOutcomes,
  StatusOutcomes,
  ParticipantJoinCtx,
  ParticipantLeaveCtx,
  ParticipantOutcomes,
  ThreadCreatedCtx,
} from "./hooks/index.js";

export { defaultBlockRegistry, defaultRoleRegistry } from "./registry/index.js";
export type {
  BlockRegistry,
  RoleRegistry,
  BlockDefinition,
  RoleDefinition,
  BlockType,
  Role,
} from "./registry/index.js";

export type { CreateBlockOptions, BlockHookConfig } from "./block/index.js";
export type { CreateRoleOptions } from "./role/index.js";

export {
  dispatch,
  parseJsonBody,
  errorToResponse,
  successResponse,
  matchPath,
  routes,
  findRoute,
} from "./handler/index.js";
export type {
  CoreRequest,
  CoreResponse,
  RouteHandler,
  Route,
  PathMatch,
} from "./handler/index.js";
