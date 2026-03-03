import type { CoreRequest as AgnosticCoreRequest, CoreResponse } from "@better-agnostic/handler";
import type { ConversationEngine } from "../engine.js";

export interface RequestAuth {
  chatterId: string;
}

/** CoreRequest with auth?: { chatterId: string } for conversation handlers */
export type CoreRequest = AgnosticCoreRequest<RequestAuth>;

export type { CoreResponse };

export type RouteHandler = (ctx: {
  engine: ConversationEngine;
  req: CoreRequest;
}) => Promise<CoreResponse>;
