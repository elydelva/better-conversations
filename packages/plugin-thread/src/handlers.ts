import {
  type RouteHandler,
  requireAuth,
  requirePermission,
  successResponse,
} from "@better-conversation/core";
import { parseBody, policySetSchema } from "@better-conversation/schema";

export const handlePoliciesSetThread: RouteHandler = async ({ engine, req }) => {
  requireAuth(engine, req);
  const security = engine.getSecurityConfig();
  if (security.policyWriteRequiresAdmin) {
    await requirePermission(engine, req, "admin:managePolicies");
  }
  const blockId = req.params.blockId;
  const data = parseBody(req, policySetSchema);
  await engine.policies.setThread(blockId, data);
  return successResponse(null, 204);
};
