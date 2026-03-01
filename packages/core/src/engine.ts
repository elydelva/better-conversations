import type { ConversationConfig } from "./config/index.js";
import type { BlockRegistry, RoleRegistry } from "./registry/index.js";
import { BlockService } from "./services/BlockService.js";
import { ChatterService } from "./services/ChatterService.js";
import { ConversationService } from "./services/ConversationService.js";
import { ParticipantService } from "./services/ParticipantService.js";
import { PermissionService } from "./services/PermissionService.js";
import { PolicyService } from "./services/PolicyService.js";

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

  constructor(config: ConversationConfig<TBlocks, TRoles>) {
    const { adapter } = config;

    this.chatters = new ChatterService(adapter.chatters);
    this.conversations = new ConversationService(adapter.conversations);
    this.participants = new ParticipantService(adapter.participants);
    this.blocks = new BlockService(adapter.blocks);
    this.permissions = new PermissionService(adapter.permissions);
    this.policies = new PolicyService();
  }
}
