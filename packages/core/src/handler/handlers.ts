import {
  ChatterNotFoundError,
  ConversationNotFoundError,
  ParticipantNotFoundError,
  ParticipantValidationError,
  PermissionDeniedError,
  PolicyNotImplementedError,
} from "@better-conversation/errors";
import type { ConversationEngine } from "../engine.js";
import type { CoreRequest, RouteHandler } from "./types.js";
import { successResponse } from "./utils.js";

function body<T>(req: CoreRequest): T {
  return req.body as T;
}

function requireAuthMatch(req: CoreRequest, expectedChatterId: string): void {
  if (req.auth && req.auth.chatterId !== expectedChatterId) {
    throw new PermissionDeniedError("caller_must_match_actor", expectedChatterId);
  }
}

export const handleChattersCreate: RouteHandler = async ({ engine, req }) => {
  const data = body<{
    displayName: string;
    entityType: string;
    entityId?: string;
    avatarUrl?: string;
  }>(req);
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
  const data =
    body<
      Partial<{
        displayName: string;
        avatarUrl: string;
        entityType: string;
        entityId: string;
      }>
    >(req);
  const chatter = await engine.chatters.update(id, data);
  return successResponse(chatter);
};

export const handleChattersList: RouteHandler = async ({ engine, req }) => {
  const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 50;
  const cursor = req.query.cursor;
  const result = await engine.chatters.list({ limit, cursor });
  return successResponse(result);
};

export const handleChatterConversations: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.id;
  requireAuthMatch(req, chatterId);
  const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 50;
  const cursor = req.query.cursor;
  const result = await engine.conversations.list({
    chatterId,
    limit,
    cursor,
  });
  return successResponse(result);
};

export const handleConversationsCreate: RouteHandler = async ({ engine, req }) => {
  const data = body<{
    title?: string;
    status?: string;
    entityType?: string;
    entityId?: string;
    createdBy: string;
    metadata?: Record<string, unknown>;
    participants?: Array<{ chatterId: string; role: string }>;
  }>(req);
  requireAuthMatch(req, data.createdBy);
  const conv = await engine.conversations.create({
    title: data.title ?? null,
    status: (data.status as "open" | "archived" | "locked") ?? "open",
    entityType: data.entityType ?? null,
    entityId: data.entityId ?? null,
    createdBy: data.createdBy,
    metadata: data.metadata ?? null,
  });
  if (data.participants?.length) {
    for (const p of data.participants) {
      await engine.participants.add({
        conversationId: conv.id,
        chatterId: p.chatterId,
        role: p.role,
      });
    }
  }
  return successResponse(conv, 201);
};

export const handleConversationsFind: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  const conv = await engine.conversations.find(id);
  if (!conv) {
    throw new ConversationNotFoundError(id);
  }
  return successResponse(conv);
};

export const handleConversationsUpdate: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  const data =
    body<
      Partial<{
        title: string;
        status: "open" | "archived" | "locked";
        entityType: string;
        entityId: string;
      }>
    >(req);
  const conv = await engine.conversations.update(id, data);
  return successResponse(conv);
};

export const handleConversationsArchive: RouteHandler = async ({ engine, req }) => {
  const id = req.params.id;
  await engine.conversations.archive(id);
  return successResponse(null, 204);
};

export const handleConversationsListOrFindByEntity: RouteHandler = async ({ engine, req }) => {
  const entityType = req.query.entityType;
  const entityId = req.query.entityId;
  if (entityType && entityId) {
    const convs = await engine.conversations.findByEntity(entityType, entityId);
    return successResponse(convs);
  }
  const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 50;
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
  const participants = await engine.participants.list(conversationId);
  return successResponse(participants);
};

export const handleParticipantsAdd: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const data = body<{ chatterId: string; role: string }>(req);
  const participant = await engine.participants.add({
    conversationId,
    chatterId: data.chatterId,
    role: data.role,
  });
  const hooks = engine.getHooks();
  if (hooks?.onParticipantAfterJoin) {
    const conversation = await engine.conversations.find(conversationId);
    const chatter = await engine.chatters.find(data.chatterId);
    const participants = await engine.participants.list(conversationId);
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
  const data = body<{ role: string }>(req);
  if (!data.role || typeof data.role !== "string") {
    throw new ParticipantValidationError("role is required");
  }
  const participant = await engine.participants.setRole(conversationId, chatterId, data.role);
  return successResponse(participant);
};

export const handleBlocksList: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 50;
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
  const data = body<{
    authorId: string;
    type: string;
    body?: string;
    metadata?: Record<string, unknown>;
    threadParentId?: string;
  }>(req);
  requireAuthMatch(req, data.authorId);
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
  const data = body<{
    body?: string;
    metadata?: Record<string, unknown>;
  }>(req);
  const existing = await engine.blocks.find(blockId);
  if (existing) {
    requireAuthMatch(req, existing.authorId);
  }
  const block = await engine.blocks.updateMeta(blockId, data);
  return successResponse(block);
};

export const handleBlocksDelete: RouteHandler = async ({ engine, req }) => {
  const blockId = req.params.blockId;
  const block = await engine.blocks.find(blockId);
  if (block) {
    requireAuthMatch(req, block.authorId);
  }
  await engine.blocks.delete(blockId);
  return successResponse(null, 204);
};

export const handlePoliciesGetGlobal: RouteHandler = async ({ engine }) => {
  const resolved = await engine.policies.resolve("_global");
  return successResponse(resolved);
};

export const handlePoliciesSetGlobal: RouteHandler = async ({ engine, req }) => {
  const data = body<Record<string, unknown>>(req);
  await engine.policies.setGlobal(data);
  return successResponse(null, 204);
};

export const handlePoliciesListRoles: RouteHandler = async ({ engine }) => {
  const roles = engine.policies.listRoles();
  return successResponse({ roles });
};

export const handlePoliciesSetRole: RouteHandler = async ({ engine, req }) => {
  const role = req.params.role;
  const data = body<Record<string, unknown>>(req);
  await engine.policies.setRole(role, data);
  return successResponse(null, 204);
};

export const handlePoliciesResolve: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.chatterId;
  requireAuthMatch(req, chatterId);
  const conversationId = req.query.conversationId;
  const threadParentBlockId = req.query.threadParentBlockId;
  const resolved = await engine.policies.resolve(chatterId, conversationId, threadParentBlockId);
  return successResponse(resolved);
};

export const handlePoliciesSetChatter: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.chatterId;
  requireAuthMatch(req, chatterId);
  const data = body<Record<string, unknown>>(req);
  await engine.policies.setChatter(chatterId, data);
  return successResponse(null, 204);
};

export const handlePoliciesSetConversation: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const data = body<Record<string, unknown>>(req);
  await engine.policies.setConversation(conversationId, data);
  return successResponse(null, 204);
};

export const handlePoliciesSetThread: RouteHandler = async ({ engine, req }) => {
  const conversationId = req.params.id;
  const blockId = req.params.blockId;
  const data = body<Record<string, unknown>>(req);
  await engine.policies.setThread(blockId, data);
  return successResponse(null, 204);
};

export const handlePermissionsList: RouteHandler = async () => {
  throw new PolicyNotImplementedError("permissions.list");
};

export const handlePermissionsGrant: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.id;
  const data = body<{ action: string; scope?: string }>(req);
  await engine.permissions.grant(chatterId, data.action, data.scope);
  return successResponse(null, 204);
};

export const handlePermissionsRevoke: RouteHandler = async ({ engine, req }) => {
  const chatterId = req.params.id;
  const action = req.params.action;
  await engine.permissions.revoke(chatterId, action);
  return successResponse(null, 204);
};
