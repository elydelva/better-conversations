import {
  ChatterNotFoundError,
  ConversationNotFoundError,
  ParticipantNotFoundError,
  PolicyNotImplementedError,
} from "@better-conversation/errors";
import {
  blockSendSchema,
  blockUpdateMetaSchema,
  chatterCreateSchema,
  chatterUpdateSchema,
  conversationCreateSchema,
  conversationUpdateSchema,
  parseBody,
  participantAddSchema,
  participantSetRoleSchema,
  permissionGrantSchema,
  policySetSchema,
} from "@better-conversation/schema";
import type { ConversationEngine } from "../engine.js";
import {
  requireAuth,
  requireAuthMatch,
  requireParticipant,
  requirePermission,
  requireRole,
} from "./securityHelpers.js";
import type { RouteHandler } from "./types.js";
import { parseLimit, successResponse } from "./utils.js";

export const handleChattersCreate: RouteHandler = async ({ engine, req }) => {
  const data = parseBody(req, chatterCreateSchema);
  const chatter = await engine.chatters.create({
    displayName: data.displayName,
    entityType: data.entityType,
    entityId: data.entityId ?? null,
    avatarUrl: data.avatarUrl ?? null,
  });
  return successResponse(chatter, 201);
};

export const handleChattersFind: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  const chatter = await engine.chatters.find(id);
  if (!chatter) {
    throw new ChatterNotFoundError(id);
  }
  return successResponse(chatter);
};

export const handleChattersUpdate: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  requireAuthMatch(engine, req, id);
  const data = parseBody(req, chatterUpdateSchema);
  const chatter = await engine.chatters.update(id, data);
  return successResponse(chatter);
};

export const handleChattersList: RouteHandler = async ({ engine, req }) => {
  const security = engine.getSecurityConfig();
  if (!security.allowListChatters) {
    requireAuth(engine, req);
    await requirePermission(engine, req, "admin:listChatters");
  }
  const limit = parseLimit(req.query.limit, 50);
  const cursor = req.query.cursor;
  const result = await engine.chatters.list({ limit, cursor });
  return successResponse(result);
};

export const handleChatterConversations: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.id;
  requireAuthMatch(engine, req, chatterId);
  const limit = parseLimit(req.query.limit, 50);
  const cursor = req.query.cursor;
  const result = await engine.conversations.list({
    chatterId,
    limit,
    cursor,
  });
  return successResponse(result);
};

export const handleConversationsCreate: RouteHandler = async ({ engine, req }) => {
  const data = parseBody(req, conversationCreateSchema);
  requireAuthMatch(engine, req, data.createdBy);
  const conv = await engine.conversations.create({
    title: data.title ?? null,
    status: (data.status as "open" | "archived" | "locked") ?? "open",
    entityType: data.entityType ?? null,
    entityId: data.entityId ?? null,
    createdBy: data.createdBy,
    metadata: data.metadata ?? null,
  });
  if (data.participants?.length) {
    await Promise.all(
      data.participants.map((p) =>
        engine.participants.add({
          conversationId: conv.id,
          chatterId: p.chatterId,
          role: p.role,
        })
      )
    );
  }
  return successResponse(conv, 201);
};

export const handleConversationsFind: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  const security = engine.getSecurityConfig();
  if (security.participantAccessControl) {
    await requireParticipant(engine, req, id);
  }
  const conv = await engine.conversations.find(id);
  if (!conv) {
    throw new ConversationNotFoundError(id);
  }
  return successResponse(conv);
};

export const handleConversationsUpdate: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  const security = engine.getSecurityConfig();
  if (security.participantAccessControl) {
    await requireParticipant(engine, req, id);
  }
  const data = parseBody(req, conversationUpdateSchema);
  const conv = await engine.conversations.update(id, data);
  return successResponse(conv);
};

export const handleConversationsArchive: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  const security = engine.getSecurityConfig();
  if (security.archiveRequiresPermission) {
    requireAuth(engine, req);
    const callerChatterId = req.auth?.chatterId ?? "";
    const hasAdminArchive = await engine.permissions.check(callerChatterId, "admin:archive");
    if (!hasAdminArchive) {
      await requireRole(engine, req, id, ["owner"]);
    }
  }
  await engine.conversations.archive(id);
  return successResponse(null, 204);
};

export const handleConversationsListOrFindByEntity: RouteHandler = async ({ engine, req }) => {
  const entityType = req.query.entityType;
  const entityId = req.query.entityId;
  const security = engine.getSecurityConfig();
  if (entityType && entityId) {
    if (!security.allowListConversationsByEntity) {
      requireAuth(engine, req);
      await requirePermission(engine, req, "admin:listConversations");
    }
    const convs = await engine.conversations.findByEntity(entityType, entityId);
    return successResponse(convs);
  }
  if (!security.allowListConversations) {
    requireAuth(engine, req);
    await requirePermission(engine, req, "admin:listConversations");
  }
  const limit = parseLimit(req.query.limit, 50);
  const result = await engine.conversations.list({
    entityType,
    entityId,
    status: req.query.status as "open" | "archived" | "locked" | undefined,
    limit,
    cursor: req.query.cursor,
  });
  return successResponse(result);
};

export const handleParticipantsList: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const security = engine.getSecurityConfig();
  if (security.participantAccessControl) {
    await requireParticipant(engine, req, conversationId);
  }
  const participants = await engine.participants.list(conversationId);
  return successResponse(participants);
};

export const handleParticipantsAdd: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const security = engine.getSecurityConfig();
  if (security.addParticipantRequiresRole) {
    const hasAdminAdd = await engine.permissions.check(
      req.auth?.chatterId ?? "",
      "admin:addParticipant"
    );
    if (!hasAdminAdd) {
      requireAuth(engine, req);
      await requireRole(engine, req, conversationId, ["owner", "moderator"]);
    }
  }
  const data = parseBody(req, participantAddSchema);
  const participant = await engine.participants.add({
    conversationId,
    chatterId: data.chatterId,
    role: data.role,
  });
  const hooks = engine.getHooks();
  if (hooks?.onParticipantAfterJoin) {
    const [conversation, chatter, participants] = await Promise.all([
      engine.conversations.find(conversationId),
      engine.chatters.find(data.chatterId),
      engine.participants.list(conversationId),
    ]);
    if (conversation && chatter) {
      await hooks.onParticipantAfterJoin({
        conversation,
        chatter,
        role: data.role,
        participants,
        participant,
        engine,
      });
    }
  }
  return successResponse(participant, 201);
};

export const handleParticipantsRemove: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const chatterId = req.params.chatterId;
  const security = engine.getSecurityConfig();
  if (security.removeParticipantRequiresRole) {
    await requireRole(engine, req, conversationId, ["owner", "moderator"]);
  }
  const participant = await engine.participants.find(conversationId, chatterId);
  if (!participant) {
    throw new ParticipantNotFoundError(conversationId, chatterId);
  }
  await engine.participants.remove(participant.id);
  return successResponse(null, 204);
};

export const handleParticipantsSetRole: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const chatterId = req.params.chatterId;
  const security = engine.getSecurityConfig();
  if (security.setRoleRequiresAdmin) {
    const hasAdminSet = await engine.permissions.check(req.auth?.chatterId ?? "", "admin:setRole");
    if (!hasAdminSet) {
      requireAuth(engine, req);
      await requireRole(engine, req, conversationId, ["owner"]);
    }
  }
  const data = parseBody(req, participantSetRoleSchema);
  const participant = await engine.participants.setRole(conversationId, chatterId, data.role);
  return successResponse(participant);
};

export const handleBlocksList: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const security = engine.getSecurityConfig();
  if (security.participantAccessControl) {
    await requireParticipant(engine, req, conversationId);
  }
  const limit = parseLimit(req.query.limit, 50);
  const beforeRaw = req.query.before;
  const afterRaw = req.query.after;
  const before = beforeRaw ? new Date(beforeRaw) : undefined;
  const after = afterRaw ? new Date(afterRaw) : undefined;
  const result = await engine.blocks.list({
    conversationId,
    limit,
    before: Number.isNaN(before?.getTime()) ? undefined : before,
    after: Number.isNaN(after?.getTime()) ? undefined : after,
    threadParentId:
      req.query.threadParentId === "" ? null : (req.query.threadParentId ?? undefined),
  });
  return successResponse(result);
};

export const handleBlocksSend: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const data = parseBody(req, blockSendSchema);
  requireAuthMatch(engine, req, data.authorId);
  const block = await engine.blocks.send({
    conversationId,
    authorId: data.authorId,
    type: data.type,
    body: data.body ?? null,
    metadata: data.metadata ?? null,
    threadParentId: data.threadParentId ?? null,
  });
  return successResponse(block, 201);
};

export const handleBlocksUpdateMeta: RouteHandler = async ({ engine, req }) => {
  const blockId = req.params.blockId;
  const data = parseBody(req, blockUpdateMetaSchema);
  const existing = await engine.blocks.find(blockId);
  if (existing) {
    requireAuthMatch(engine, req, existing.authorId);
  }
  const block = await engine.blocks.updateMeta(blockId, data);
  return successResponse(block);
};

export const handleBlocksDelete: RouteHandler = async ({ engine, req }) => {
  const blockId = req.params.blockId;
  const block = await engine.blocks.find(blockId);
  if (block) {
    requireAuthMatch(engine, req, block.authorId);
  }
  await engine.blocks.delete(blockId);
  return successResponse(null, 204);
};

export const handlePoliciesGetGlobal: RouteHandler = async ({ engine }) => {
  const resolved = await engine.policies.resolve("_global");
  return successResponse(resolved);
};

export const handlePoliciesSetGlobal: RouteHandler = async ({ engine, req }) => {
  requireAuth(engine, req);
  const security = engine.getSecurityConfig();
  if (security.policyWriteRequiresAdmin) {
    await requirePermission(engine, req, "admin:managePolicies");
  }
  const data = parseBody(req, policySetSchema);
  await engine.policies.setGlobal(data);
  return successResponse(null, 204);
};

export const handlePoliciesListRoles: RouteHandler = async ({ engine }) => {
  const roles = engine.policies.listRoles();
  return successResponse({ roles });
};

export const handlePoliciesSetRole: RouteHandler = async ({ engine, req }) => {
  requireAuth(engine, req);
  const security = engine.getSecurityConfig();
  if (security.policyWriteRequiresAdmin) {
    await requirePermission(engine, req, "admin:managePolicies");
  }
  const role = req.params.role;
  const data = parseBody(req, policySetSchema);
  await engine.policies.setRole(role, data);
  return successResponse(null, 204);
};

export const handlePoliciesResolve: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.chatterId;
  requireAuthMatch(engine, req, chatterId);
  const conversationId = req.query.conversationId;
  const threadParentBlockId = req.query.threadParentBlockId;
  const resolved = await engine.policies.resolve(chatterId, conversationId, threadParentBlockId);
  return successResponse(resolved);
};

export const handlePoliciesSetChatter: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.chatterId;
  const security = engine.getSecurityConfig();
  if (security.policyWriteRequiresAdmin) {
    requireAuth(engine, req);
    const callerId = req.auth?.chatterId;
    if (!callerId || callerId !== chatterId) {
      await requirePermission(engine, req, "admin:managePolicies");
    }
  } else {
    requireAuthMatch(engine, req, chatterId);
  }
  const data = parseBody(req, policySetSchema);
  await engine.policies.setChatter(chatterId, data);
  return successResponse(null, 204);
};

export const handlePoliciesSetConversation: RouteHandler = async ({ engine, req }) => {
  requireAuth(engine, req);
  const security = engine.getSecurityConfig();
  if (security.policyWriteRequiresAdmin) {
    await requirePermission(engine, req, "admin:managePolicies");
  }
  const conversationId = req.params.id;
  const data = parseBody(req, policySetSchema);
  await engine.policies.setConversation(conversationId, data);
  return successResponse(null, 204);
};

export const handlePermissionsList: RouteHandler = async () => {
  throw new PolicyNotImplementedError("permissions.list");
};

export const handlePermissionsGrant: RouteHandler = async ({ engine, req }) => {
  requireAuth(engine, req);
  const security = engine.getSecurityConfig();
  if (security.grantRevokePermissionsRequiresAdmin) {
    await requirePermission(engine, req, "admin:grantPermissions");
  }
  const chatterId = req.params.id;
  const data = parseBody(req, permissionGrantSchema);
  await engine.permissions.grant(chatterId, data.action, data.scope);
  return successResponse(null, 204);
};

export const handlePermissionsRevoke: RouteHandler = async ({ engine, req }) => {
  requireAuth(engine, req);
  const security = engine.getSecurityConfig();
  if (security.grantRevokePermissionsRequiresAdmin) {
    await requirePermission(engine, req, "admin:grantPermissions");
  }
  const chatterId = req.params.id;
  const action = req.params.action;
  await engine.permissions.revoke(chatterId, action);
  return successResponse(null, 204);
};
