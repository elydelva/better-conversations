export interface SecurityConfig {
  /** Exiger auth pour les handlers sensibles ; requireAuthMatch rejette si auth absente */
  requireAuth?: boolean;
  /** Restreindre accès conv/blocs/participants aux seuls participants */
  participantAccessControl?: boolean;
  /** GET /chatters exige admin:listChatters */
  allowListChatters?: boolean;
  /** GET /conversations liste globale exige admin:listConversations */
  allowListConversations?: boolean;
  /** findByEntity (entityType+entityId) exige admin ou participant des convs retournées */
  allowListConversationsByEntity?: boolean;
  /** GET /chatters/:id public (true) ou exige permission (false) */
  allowFindChatter?: boolean;
  /** Archiver exige admin:archive ou rôle owner */
  archiveRequiresPermission?: boolean;
  /** Ajouter participant exige owner ou moderator ou permission */
  addParticipantRequiresRole?: boolean;
  /** Retirer participant exige owner ou moderator */
  removeParticipantRequiresRole?: boolean;
  /** Changer rôle exige admin ou owner */
  setRoleRequiresAdmin?: boolean;
  /** Grant/revoke permissions exige admin:grantPermissions */
  grantRevokePermissionsRequiresAdmin?: boolean;
  /** Modifier policies exige admin:managePolicies */
  policyWriteRequiresAdmin?: boolean;
}

const defaultSecurityConfig: Required<SecurityConfig> = {
  requireAuth: true,
  participantAccessControl: true,
  allowListChatters: false,
  allowListConversations: false,
  allowListConversationsByEntity: false,
  allowFindChatter: true,
  archiveRequiresPermission: true,
  addParticipantRequiresRole: true,
  removeParticipantRequiresRole: true,
  setRoleRequiresAdmin: true,
  grantRevokePermissionsRequiresAdmin: true,
  policyWriteRequiresAdmin: true,
};

export function getDefaultSecurityConfig(): Required<SecurityConfig> {
  return { ...defaultSecurityConfig };
}

export function mergeSecurityConfig(
  partial?: Partial<SecurityConfig> | null
): Required<SecurityConfig> {
  if (!partial || Object.keys(partial).length === 0) {
    return getDefaultSecurityConfig();
  }
  return { ...defaultSecurityConfig, ...partial };
}
