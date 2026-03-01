import type { PolicyObject } from "../policy/index.js";

export interface BlockDefinition<TSchema = unknown> {
  type: string;
  schema?: TSchema;
  hooks?: {
    beforeSend?: (
      ctx: unknown,
      outcomes: { next: () => Promise<unknown>; refuse: (reason: string) => Promise<unknown> }
    ) => Promise<unknown>;
  };
}

export interface RoleDefinition {
  name: string;
  extends?: string;
  policy: PolicyObject;
}

export type BlockRegistry = Record<string, BlockDefinition>;
export type RoleRegistry = Record<string, RoleDefinition>;

export type BlockType<T extends BlockRegistry> = keyof T & string;
export type Role<T extends RoleRegistry> = keyof T & string;
