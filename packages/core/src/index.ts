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
} from "@better-conversation/types";

export {
  createAdapterHelpers,
  createUnsupportedPolicyAdapter,
  createUnsupportedRegistriesAdapter,
} from "./adapter/index.js";
export type {
  AdapterOptions,
  DatabaseAdapter,
  ChatterAdapter,
  ConversationAdapter,
  ParticipantAdapter,
  BlockAdapter,
  PermissionAdapter,
  PolicyAdapter,
  PolicyLevel,
  RegistryAdapter,
  StoredPolicy,
} from "./adapter/index.js";

export {
  getDefaultSecurityConfig,
  mergeSecurityConfig,
} from "./config/index.js";
export type {
  ConversationConfig,
  ConversationPlugin,
  SecurityConfig,
} from "./config/index.js";

export {
  getDefaultGlobal,
  mergePolicyLevels,
} from "./policy/index.js";
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
  BlockBeforeUpdateCtx,
  BlockAfterUpdateCtx,
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

export { createInMemoryAuditStore } from "./audit/index.js";
export type { AuditStore, AuditEntry, AuditQueryFilters } from "./audit/index.js";

export {
  baseSchemaContribution,
  buildSchema,
  mergeSchemas,
} from "./schema/index.js";
export type {
  ColumnDef,
  ColumnType,
  MergedSchema,
  RelationDef,
  SchemaContribution,
  TableDef,
  TableExtension,
  BuildSchemaOptions,
  SchemaContributor,
  MergeSchemasOptions,
} from "./schema/index.js";

export {
  dispatch,
  parseJsonBody,
  queryToRecord,
  parseLimit,
  errorToResponse,
  successResponse,
  streamResponse,
  matchPath,
  routes,
  findRoute,
} from "./handler/index.js";
export type {
  CoreRequest,
  CoreResponse,
  RequestAuth,
  RouteHandler,
  Route,
  PathMatch,
} from "./handler/index.js";
