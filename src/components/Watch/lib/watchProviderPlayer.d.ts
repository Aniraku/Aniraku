export interface ProviderTransportOverride {
  rule: string;
  proxyOnly?: boolean;
  directPreferred?: boolean;
}
export const PROVIDER_PLAYBACK_RULES: ReadonlyArray<{
  readonly name: string;
  readonly predicate: (source: unknown) => boolean;
  readonly transport: Readonly<Record<string, boolean>>;
}>;
export function getProviderTransportOverride(
  source: unknown,
): ProviderTransportOverride | null;
export function shouldPreferProviderPlayer(source: unknown): boolean;
export function shouldTryHlsFallback(url: string): boolean;
export function shouldPreferNativeHls(url: string): boolean;
