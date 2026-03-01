import {
  type MergeStrategy,
  type PolicyObject,
  getDefaultGlobal,
  mergePolicyLevels,
} from "@better-conversation/core";
import { NextResponse } from "next/server";

export interface ResolveBody {
  global?: Partial<PolicyObject>;
  roles?: Partial<Record<string, PolicyObject>>;
  mergeStrategy?: MergeStrategy;
  chatterId: string;
  conversationId?: string;
  threadParentBlockId?: string;
  role?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ResolveBody;
  const { global, roles, mergeStrategy = "override", role = "member" } = body;

  const levels: Partial<PolicyObject>[] = [];

  const effectiveGlobal = global ?? getDefaultGlobal();
  if (Object.keys(effectiveGlobal).length > 0) {
    levels.push(effectiveGlobal);
  }

  const rolePolicy = roles?.[role];
  if (rolePolicy && Object.keys(rolePolicy).length > 0) {
    levels.push(rolePolicy);
  }

  const resolved = mergePolicyLevels(levels, mergeStrategy);

  return NextResponse.json(resolved);
}
