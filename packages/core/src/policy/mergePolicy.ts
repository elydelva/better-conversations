import type { MergeStrategy, PolicyObject } from "./index.js";

const DEFAULT_GLOBAL: PolicyObject = {
  canJoinSelf: false,
  readOnly: false,
  threadClosed: false,
  allowedBlocks: ["text"],
  deniedBlocks: [],
  maxBlockBodyLength: 4000,
  canEditOwnBlocks: true,
  canDeleteOwnBlocks: true,
  editWindowSeconds: 300,
  maxBlocksPerMinute: 20,
  maxBlocksPerHour: 200,
  sendCooldownMs: 500,
  threadsEnabled: true,
  maxThreadDepth: 1,
};

function isMoreRestrictive(
  key: keyof PolicyObject,
  a: PolicyObject[keyof PolicyObject] | undefined,
  b: PolicyObject[keyof PolicyObject] | undefined
): PolicyObject[keyof PolicyObject] | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  const keyStr = key as string;
  if (keyStr === "readOnly" || keyStr === "threadClosed") {
    return !!(a as boolean) || !!(b as boolean);
  }
  if (
    keyStr === "canEditOwnBlocks" ||
    keyStr === "canDeleteOwnBlocks" ||
    keyStr === "threadsEnabled"
  ) {
    return !!(a as boolean) && !!(b as boolean);
  }
  if (
    keyStr === "maxBlockBodyLength" ||
    keyStr === "editWindowSeconds" ||
    keyStr === "maxBlocksPerMinute" ||
    keyStr === "maxBlocksPerHour" ||
    keyStr === "maxBlocksPerDay" ||
    keyStr === "maxBlocksPerConversation" ||
    keyStr === "sendCooldownMs" ||
    keyStr === "maxThreadDepth" ||
    keyStr === "maxThreadReplies" ||
    keyStr === "maxParticipants"
  ) {
    const an = a as number;
    const bn = b as number;
    if (Number.isNaN(an)) return bn;
    if (Number.isNaN(bn)) return an;
    return Math.min(an, bn);
  }
  if (keyStr === "allowedBlocks") {
    const av = a as string[] | "*";
    const bv = b as string[] | "*";
    if (av === "*" && bv !== "*") return bv;
    if (bv === "*" && av !== "*") return av;
    if (Array.isArray(av) && Array.isArray(bv)) {
      return av.filter((x) => bv.includes(x));
    }
    return av;
  }
  if (keyStr === "deniedBlocks") {
    const av = a as string[];
    const bv = b as string[];
    if (!Array.isArray(av)) return bv;
    if (!Array.isArray(bv)) return av;
    return [...new Set([...av, ...bv])];
  }
  return a;
}

function mergeOverride(base: PolicyObject, override: Partial<PolicyObject>): PolicyObject {
  const result = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v !== undefined) {
      (result as Record<string, unknown>)[k] = v;
    }
  }
  return result;
}

function mergeRestrict(base: PolicyObject, override: Partial<PolicyObject>): PolicyObject {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof PolicyObject)[]) {
    const ov = override[key];
    if (ov !== undefined) {
      const bv = base[key];
      const restricted = isMoreRestrictive(key, bv, ov);
      (result as Record<string, unknown>)[key] = restricted ?? ov;
    }
  }
  return result as PolicyObject;
}

export function mergePolicyLevels(
  levels: Partial<PolicyObject>[],
  strategy: MergeStrategy = "override"
): PolicyObject {
  let result: PolicyObject = { ...DEFAULT_GLOBAL };
  for (const level of levels) {
    if (!level || Object.keys(level).length === 0) continue;
    result = strategy === "restrict" ? mergeRestrict(result, level) : mergeOverride(result, level);
  }
  result.canJoinSelf = false;
  return result;
}

export function getDefaultGlobal(): PolicyObject {
  return { ...DEFAULT_GLOBAL };
}
