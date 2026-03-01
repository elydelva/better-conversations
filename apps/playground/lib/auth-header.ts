/** Dev playground: stores the active chatter ID for X-Chatter-Id header */
let currentChatterId: string | null = null;

export function setAuthChatterId(id: string | null): void {
  currentChatterId = id;
}

export function getAuthChatterId(): string | null {
  return currentChatterId;
}
