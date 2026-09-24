export function getHlsBufferPolicy(
  connection?: Record<string, unknown>,
  options?: { kiwi?: boolean },
): Record<string, unknown>;
export function getHlsRequestCacheMode(context?: { url?: string }): string;
export function isTerminalHlsStatus(status: unknown): boolean;
export function getHlsLoadPolicies(): Record<string, unknown>;
export function getDashBufferPolicy(
  connection?: Record<string, unknown>,
): Record<string, unknown>;
