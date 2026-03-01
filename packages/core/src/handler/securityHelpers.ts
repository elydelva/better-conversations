import { PermissionDeniedError } from "@better-conversation/errors";
import type { ConversationEngine } from "../engine.js";
import type { CoreRequest } from "./types.js";

export async function requireParticipant(
  engine: ConversationEngine,
  req: CoreRequest,
  conversationId: string
): Promise<void> {
  const chatterId = req.auth?.chatterId;
  if (!chatterId) {
    throw new PermissionDeniedError("authentication_required");
  }
  const participant = await engine.participants.find(conversationId, chatterId);
  if (!participant || participant.leftAt) {
    throw new PermissionDeniedError("not_participant", conversationId);
  }
}

export async function requireRole(
  engine: ConversationEngine,
  req: CoreRequest,
  conversationId: string,
  allowedRoles: string[]
): Promise<void> {
  const chatterId = req.auth?.chatterId;
  if (!chatterId) {
    throw new PermissionDeniedError("authentication_required");
  }
  const participant = await engine.participants.find(conversationId, chatterId);
  if (!participant || participant.leftAt) {
    throw new PermissionDeniedError("not_participant", conversationId);
  }
  if (!allowedRoles.includes(participant.role)) {
    throw new PermissionDeniedError("insufficient_role", participant.role);
  }
}

export async function requirePermission(
  engine: ConversationEngine,
  req: CoreRequest,
  action: string,
  scope?: string
): Promise<void> {
  const chatterId = req.auth?.chatterId;
  if (!chatterId) {
    throw new PermissionDeniedError("authentication_required");
  }
  const has = await engine.permissions.check(chatterId, action, scope);
  if (!has) {
    throw new PermissionDeniedError("permission_denied", action);
  }
}

export async function hasPermission(
  engine: ConversationEngine,
  chatterId: string,
  action: string,
  scope?: string
): Promise<boolean> {
  return engine.permissions.check(chatterId, action, scope);
}

export function requireAuth(engine: ConversationEngine, req: CoreRequest): void {
  const security = engine.getSecurityConfig();
  if (security.requireAuth && !req.auth?.chatterId) {
    throw new PermissionDeniedError("authentication_required");
  }
}

export function requireAuthMatch(
  engine: ConversationEngine,
  req: CoreRequest,
  expectedChatterId: string
): void {
  const security = engine.getSecurityConfig();
  if (security.requireAuth && !req.auth?.chatterId) {
    throw new PermissionDeniedError("authentication_required");
  }
  if (req.auth && req.auth.chatterId !== expectedChatterId) {
    throw new PermissionDeniedError("caller_must_match_actor", expectedChatterId);
  }
}
