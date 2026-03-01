export interface PermissionAdapter {
  check(chatterId: string, action: string, scope?: string): Promise<boolean>;
  grant(chatterId: string, action: string, scope?: string): Promise<void>;
  revoke(chatterId: string, action: string, scope?: string): Promise<void>;
}
