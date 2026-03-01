import {
  handleBlocksDelete,
  handleBlocksList,
  handleBlocksSend,
  handleBlocksUpdateMeta,
  handleChatterConversations,
  handleChattersCreate,
  handleChattersFind,
  handleChattersUpdate,
  handleConversationsArchive,
  handleConversationsCreate,
  handleConversationsFind,
  handleConversationsListOrFindByEntity,
  handleConversationsUpdate,
  handleParticipantsAdd,
  handleParticipantsList,
  handleParticipantsMarkRead,
  handleParticipantsRemove,
  handleParticipantsSetRole,
  handlePermissionsGrant,
  handlePermissionsList,
  handlePermissionsRevoke,
  handlePoliciesGetGlobal,
  handlePoliciesListRoles,
  handlePoliciesResolve,
  handlePoliciesSetChatter,
  handlePoliciesSetConversation,
  handlePoliciesSetGlobal,
  handlePoliciesSetRole,
  handlePoliciesSetThread,
} from "./handlers.js";
import { matchPath } from "./path.js";
import type { RouteHandler } from "./types.js";

export interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

export const routes: Route[] = [
  { method: "POST", path: "/chatters", handler: handleChattersCreate },
  {
    method: "GET",
    path: "/chatters/:id/conversations",
    handler: handleChatterConversations,
  },
  { method: "GET", path: "/chatters/:id", handler: handleChattersFind },
  { method: "PATCH", path: "/chatters/:id", handler: handleChattersUpdate },

  { method: "POST", path: "/conversations", handler: handleConversationsCreate },
  {
    method: "GET",
    path: "/conversations",
    handler: handleConversationsListOrFindByEntity,
  },
  {
    method: "PATCH",
    path: "/conversations/:id/participants/:chatterId/read",
    handler: handleParticipantsMarkRead,
  },
  {
    method: "PATCH",
    path: "/conversations/:id/participants/:chatterId",
    handler: handleParticipantsSetRole,
  },
  {
    method: "DELETE",
    path: "/conversations/:id/participants/:chatterId",
    handler: handleParticipantsRemove,
  },
  {
    method: "GET",
    path: "/conversations/:id/participants",
    handler: handleParticipantsList,
  },
  {
    method: "POST",
    path: "/conversations/:id/participants",
    handler: handleParticipantsAdd,
  },
  { method: "GET", path: "/conversations/:id/blocks", handler: handleBlocksList },
  { method: "POST", path: "/conversations/:id/blocks", handler: handleBlocksSend },
  {
    method: "PATCH",
    path: "/conversations/:id/blocks/:blockId",
    handler: handleBlocksUpdateMeta,
  },
  {
    method: "DELETE",
    path: "/conversations/:id/blocks/:blockId",
    handler: handleBlocksDelete,
  },
  { method: "GET", path: "/conversations/:id", handler: handleConversationsFind },
  {
    method: "PATCH",
    path: "/conversations/:id",
    handler: handleConversationsUpdate,
  },
  {
    method: "DELETE",
    path: "/conversations/:id",
    handler: handleConversationsArchive,
  },

  {
    method: "GET",
    path: "/policies/chatters/:chatterId",
    handler: handlePoliciesResolve,
  },
  {
    method: "PATCH",
    path: "/policies/chatters/:chatterId",
    handler: handlePoliciesSetChatter,
  },
  {
    method: "PATCH",
    path: "/policies/conversations/:id",
    handler: handlePoliciesSetConversation,
  },
  {
    method: "PATCH",
    path: "/policies/conversations/:id/threads/:blockId",
    handler: handlePoliciesSetThread,
  },
  {
    method: "GET",
    path: "/policies/roles",
    handler: handlePoliciesListRoles,
  },
  {
    method: "PATCH",
    path: "/policies/roles/:role",
    handler: handlePoliciesSetRole,
  },
  {
    method: "GET",
    path: "/policies/global",
    handler: handlePoliciesGetGlobal,
  },
  {
    method: "PATCH",
    path: "/policies/global",
    handler: handlePoliciesSetGlobal,
  },
  {
    method: "GET",
    path: "/chatters/:id/permissions",
    handler: handlePermissionsList,
  },
  {
    method: "POST",
    path: "/chatters/:id/permissions",
    handler: handlePermissionsGrant,
  },
  {
    method: "DELETE",
    path: "/chatters/:id/permissions/:action",
    handler: handlePermissionsRevoke,
  },
];

export function findRoute(
  method: string,
  path: string
): { route: Route; params: Record<string, string> } | null {
  const normalizedPath = path.replace(/\/$/, "") || "/";
  for (const route of routes) {
    if (route.method !== method) continue;
    const { matches, params } = matchPath(route.path, normalizedPath);
    if (matches) return { route, params };
  }
  return null;
}
