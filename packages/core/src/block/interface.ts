export interface BlockHookConfig {
  beforeSend?: (
    ctx: unknown,
    outcomes: {
      next: () => Promise<unknown>;
      refuse: (reason: string, opts?: { code?: string }) => Promise<unknown>;
    }
  ) => Promise<unknown>;
}

export interface CreateBlockOptions<TType extends string = string> {
  type: TType;
  schema?: unknown;
  hooks?: BlockHookConfig;
}
