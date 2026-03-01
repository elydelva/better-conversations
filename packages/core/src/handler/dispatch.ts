import type { ConversationEngine } from "../engine.js";
import { findRoute } from "./routes.js";
import type { CoreRequest, CoreResponse } from "./types.js";
import { errorToResponse } from "./utils.js";

export async function dispatch(
  engine: ConversationEngine,
  req: CoreRequest,
  basePath = ""
): Promise<CoreResponse> {
  const path = basePath
    ? req.path.startsWith(basePath)
      ? req.path.slice(basePath.length) || "/"
      : req.path
    : req.path;
  const normalizedPath = path.replace(/\/$/, "") || "/";

  const routes = engine.getRoutes();
  const found = findRoute(routes, req.method, normalizedPath);
  if (!found) {
    return {
      status: 404,
      body: { code: "NOT_FOUND", message: "Route not found" },
    };
  }

  const { route, params } = found;
  const reqWithParams: CoreRequest = { ...req, params };

  try {
    return await route.handler({ engine, req: reqWithParams });
  } catch (err) {
    return errorToResponse(err);
  }
}
