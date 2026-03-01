/**
 * Minimal CoreRequest shape for parseBody - avoids circular dependency on core.
 */
export interface CoreRequest {
  body: unknown;
}
