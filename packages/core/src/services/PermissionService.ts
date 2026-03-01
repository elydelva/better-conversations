import type { PermissionAdapter } from "../adapter/index.js";

export class PermissionService {
  constructor(private readonly permissions: PermissionAdapter) {}

  async check(chatterId: string, action: string, scope?: string): Promise<boolean> {
    return this.permissions.check(chatterId, action, scope);
  }

  async grant(chatterId: string, action: string, scope?: string): Promise<void> {
    return this.permissions.grant(chatterId, action, scope);
  }

  async revoke(chatterId: string, action: string, scope?: string): Promise<void> {
    return this.permissions.revoke(chatterId, action, scope);
  }
}
