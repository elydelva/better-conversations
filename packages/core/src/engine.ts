import type { ConversationConfig } from "./config/index.js";
import { defaultBlockRegistry } from "./registry/defaultBlockRegistry.js";
import { defaultRoleRegistry } from "./registry/defaultRoleRegistry.js";
import type { BlockRegistry, RoleRegistry } from "./registry/index.js";
import { BlockService } from "./services/BlockService.js";
import { ChatterService } from "./services/ChatterService.js";
import { ConversationService } from "./services/ConversationService.js";
import { ParticipantService } from "./services/ParticipantService.js";
import { PermissionService } from "./services/PermissionService.js";
import { PolicyService } from "./services/PolicyService.js";

function schemaToJson(schema: unknown): Record<string, unknown> {
  if (schema === undefined || schema === null) return {};
  if (typeof schema === "object" && !Array.isArray(schema)) {
    return schema as Record<string, unknown>;
  }
  return {};
}

export class ConversationEngine<
  TBlocks extends BlockRegistry = BlockRegistry,
  TRoles extends RoleRegistry = RoleRegistry,
> {
  readonly chatters: ChatterService;
  readonly conversations: ConversationService;
  readonly participants: ParticipantService;
  readonly blocks: BlockService;
  readonly permissions: PermissionService;
  readonly policies: PolicyService;

  private _initDone = false;

  constructor(private readonly config: ConversationConfig<TBlocks, TRoles>) {
    const { adapter, hooks, generateId } = config;

    this.chatters = new ChatterService(adapter.chatters);
    this.conversations = new ConversationService(adapter.conversations);
    this.participants = new ParticipantService(adapter.participants);
    this.blocks = new BlockService({
      adapter,
      hooks: hooks
        ? {
            onBlockBeforeSend: hooks.onBlockBeforeSend,
            onBlockAfterSend: hooks.onBlockAfterSend,
            onBlockBeforeDelete: hooks.onBlockBeforeDelete,
          }
        : undefined,
      generateId,
    });
    this.permissions = new PermissionService(adapter.permissions);
    this.policies = new PolicyService({ adapter: adapter.policies });
  }

  async init(): Promise<void> {
    if (this._initDone) return;
    const { adapter, additionalBlocks, additionalRoles } = this.config;
    const { registries } = adapter;

    for (const [type, def] of Object.entries(defaultBlockRegistry)) {
      await registries.upsertBlock(type, schemaToJson(def.schema), true);
    }
    for (const [name, def] of Object.entries(defaultRoleRegistry)) {
      await registries.upsertRole(name, def.extends ?? null, def.policy, true);
    }
    if (additionalBlocks) {
      for (const [type, def] of Object.entries(additionalBlocks)) {
        await registries.upsertBlock(type, schemaToJson(def.schema), false);
      }
    }
    if (additionalRoles) {
      for (const [, def] of Object.entries(additionalRoles)) {
        await registries.upsertRole(def.name, def.extends ?? null, def.policy, false);
      }
    }
    this._initDone = true;
  }
}
