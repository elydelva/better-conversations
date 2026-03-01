import type { BlockAdapter } from "./BlockAdapter.interface.js";
import type { ChatterAdapter } from "./ChatterAdapter.interface.js";
import type { ConversationAdapter } from "./ConversationAdapter.interface.js";
import type { ParticipantAdapter } from "./ParticipantAdapter.interface.js";
import type { PermissionAdapter } from "./PermissionAdapter.interface.js";
import type { RegistryAdapter } from "./RegistryAdapter.interface.js";

export interface DatabaseAdapter {
  chatters: ChatterAdapter;
  conversations: ConversationAdapter;
  participants: ParticipantAdapter;
  blocks: BlockAdapter;
  permissions: PermissionAdapter;
  registries: RegistryAdapter;
}
