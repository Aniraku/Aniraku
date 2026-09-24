export function chooseBrowserPlayableEmbed<T>(
  sources: readonly T[] | null | undefined,
  isBrowserPlayableEmbedSource: (source: T) => boolean,
): T | null;

/** True when the URL carries a signed token whose expiry is already past. */
export function hasExpiredEmbeddedToken(url: unknown): boolean;

/** Classify a source: 'embed' | 'hls' | 'dash' | 'mp4' | ... | 'native'. */
export function getSourcePlaybackType(source: any): string;

/** kwik.cx (Kiwi) embed URLs refuse third-party framing. */
export function isKiwiEmbedUrl(url: unknown): boolean;

/** megaplay.* hosts break under iframe sandboxing — must get no sandbox. */
export function isSandboxBlockedEmbed(url: unknown): boolean;

/** Embed source that is NOT definitively dead (advisory verification). */
export function isPlayableEmbedSource(source: any): boolean;

/** Playable embed that is also a frameable kwik.cx /e/ URL. */
export function isKiwiEmbedSource(source: any): boolean;

/** Embed source that will actually run inside a browser iframe. */
export function isBrowserPlayableEmbedSource(source: any): boolean;
