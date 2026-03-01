import {
  type ConversationConfig,
  type SecurityConfig,
  mergeSecurityConfig,
} from "./config/index.js";
import type { Route } from "./handler/routes.js";
import { buildRoutes } from "./handler/routes.js";
import type { BlockAfterSendCtx } from "./hooks/BlockAfterSend.js";
import type { ConversationAfterCreateCtx } from "./hooks/ConversationAfterCreate.js";
import { defaultBlockRegistry } from "./registry/defaultBlockRegistry.js";
import { defaultRoleRegistry } from "./registry/defaultRoleRegistry.js";
import type { BlockRegistry, RoleRegistry } from "./registry/index.js";
import type { SchemaContributor } from "./schema/buildSchema.js";
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
  private readonly _hooks: NonNullable<ConversationConfig<TBlocks, TRoles>["hooks"]>;
  private readonly _security: Readonly<Required<SecurityConfig>>;

  constructor(private readonly config: ConversationConfig<TBlocks, TRoles>) {
    const { adapter, generateId } = config;

    this._security = mergeSecurityConfig(config.security);
    this._hooks = this.mergeHooks();
    const hooks = this._hooks;

    this.chatters = new ChatterService(adapter.chatters);
    this.conversations = new ConversationService({
      conversations: adapter.conversations,
      hooks: hooks ? { onConversationAfterCreate: hooks.onConversationAfterCreate } : undefined,
      engine: this,
    });
    this.participants = new ParticipantService({
      participants: adapter.participants,
      roleRegistry: { ...defaultRoleRegistry, ...config.additionalRoles },
    });
    this.policies = new PolicyService({
      adapter,
      policiesConfig: config.policies,
      roleRegistry: { ...defaultRoleRegistry, ...config.additionalRoles },
    });
    this.blocks = new BlockService({
      adapter,
      policyService: this.policies,
      engine: this,
      hooks: hooks
        ? {
            onBlockBeforeSend: hooks.onBlockBeforeSend,
            onBlockAfterSend: hooks.onBlockAfterSend,
            onBlockBeforeDelete: hooks.onBlockBeforeDelete,
            onBlockBeforeUpdate: hooks.onBlockBeforeUpdate,
            onBlockAfterUpdate: hooks.onBlockAfterUpdate,
          }
        : undefined,
      generateId,
    });
    this.permissions = new PermissionService(adapter.permissions);

    this.attachPluginServices();
  }

  private mergeHooks(): NonNullable<ConversationConfig<TBlocks, TRoles>["hooks"]> {
    let merged = this.config.hooks ?? {};
    for (const plugin of this.config.plugins ?? []) {
      if (plugin.hooks) {
        merged = { ...merged, ...plugin.hooks };
      }
    }
    merged = this.mergeAuditHooks(merged);
    return merged;
  }

  private mergeAuditHooks(
    hooks: NonNullable<ConversationConfig<TBlocks, TRoles>["hooks"]>
  ): NonNullable<ConversationConfig<TBlocks, TRoles>["hooks"]> {
    const store = this.config.audit?.store;
    if (!store) return hooks;

    const composeBlockAfter = async (ctx: BlockAfterSendCtx) => {
      if (hooks?.onBlockAfterSend) await hooks.onBlockAfterSend(ctx);
      await store.append({
        event: "block:created",
        entityType: "block",
        entityId: ctx.block.id,
        payload: {
          conversationId: ctx.block.conversationId,
          authorId: ctx.block.authorId,
          type: ctx.block.type,
          body: ctx.block.body,
          metadata: ctx.block.metadata,
        },
      });
    };

    const composeConvAfter = async (ctx: ConversationAfterCreateCtx) => {
      if (hooks?.onConversationAfterCreate) await hooks.onConversationAfterCreate(ctx);
      await store.append({
        event: "conversation:created",
        entityType: "conversation",
        entityId: ctx.conversation.id,
        payload: {
          createdBy: ctx.conversation.createdBy,
          title: ctx.conversation.title,
          status: ctx.conversation.status,
        },
      });
    };

    return {
      ...hooks,
      onBlockAfterSend: composeBlockAfter,
      onConversationAfterCreate: composeConvAfter,
    };
  }

  private attachPluginServices(): void {
    for (const plugin of this.config.plugins ?? []) {
      const services = plugin.createServices?.(this, this.config);
      if (services) {
        for (const [key, svc] of Object.entries(services)) {
          (this as Record<string, unknown>)[key] = svc;
        }
      }
    }
  }

  getRoutes(): Route[] {
    return buildRoutes(this.config.plugins);
  }

  getPlugin<T>(name: string): T | undefined {
    return (this as Record<string, unknown>)[name] as T | undefined;
  }

  getHooks(): ConversationConfig<TBlocks, TRoles>["hooks"] {
    return this._hooks;
  }

  getSecurityConfig(): Readonly<Required<SecurityConfig>> {
    return this._security;
  }

  /**
   * Returns schema config for CLI schema generation. Used by @better-conversation/cli.
   */
  getSchemaConfigForCLI(): { tablePrefix: string; contributors: SchemaContributor[] } {
    const plugins = this.config.plugins ?? [];
    const contributors: SchemaContributor[] = [];
    for (const p of plugins) {
      if (p != null && typeof p === "object" && "schemaContribution" in p) {
        const c = p as SchemaContributor;
        if (c.schemaContribution != null) {
          contributors.push(c);
        }
      }
    }
    return {
      tablePrefix: this.config.tablePrefix ?? "bc_",
      contributors,
    };
  }

  async init(): Promise<void> {
    if (this._initDone) return;
    const { adapter, additionalBlocks, additionalRoles } = this.config;
    const { registries } = adapter;

    await Promise.all([
      ...Object.entries(defaultBlockRegistry).map(([type, def]) =>
        registries.upsertBlock(type, schemaToJson(def.schema), true)
      ),
      ...Object.entries(defaultRoleRegistry).map(([name, def]) =>
        registries.upsertRole(name, def.extends ?? null, def.policy, true)
      ),
    ]);
    if (additionalBlocks || additionalRoles) {
      await Promise.all([
        ...(additionalBlocks
          ? Object.entries(additionalBlocks).map(([type, def]) =>
              registries.upsertBlock(type, schemaToJson(def.schema), false)
            )
          : []),
        ...(additionalRoles
          ? Object.values(additionalRoles).map((def) =>
              registries.upsertRole(def.name, def.extends ?? null, def.policy, false)
            )
          : []),
      ]);
    }
    this._initDone = true;
  }
}
