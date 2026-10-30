// Segment prefetch pool — "call multiple segments per segment".
//
// hls.js fetches fragments strictly one after another; on a cold cache the
// buffer only grows at network latency speed. This pool runs ahead of the
// playhead: it issues plain fetch()es for the NEXT few segment URLs with a
// small worker pool so several segments are always in flight together. The
// responses land in the browser's HTTP cache, so when hls.js gets to those
// fragments its own request resolves from cache instead of the network —
// the buffer fills several segments at a time instead of dribbling.
//
// Deliberately ZERO-RISK by design: hls.js is never overridden. If a
// prefetch fails, or the CDN serves segments with no-store cache headers,
// hls.js simply downloads that segment as it always did.

const MAX_IN_FLIGHT = 3;
const MAX_WARM_PER_CALL = 6;

let inFlight = 0;
const queued: (() => void)[] = [];
const warmed = new Set<string>();
const failed = new Set<string>();
let activeHeaders: Record<string, string> | null = null;

function pump(): void {
  while (inFlight < MAX_IN_FLIGHT && queued.length > 0) {
    const job = queued.shift();
    if (!job) return;
    inFlight += 1;
    void job();
  }
}

/** Update the request headers used by prefetch fetches (CDN Referer etc). */
export function configurePrefetch(
  headers: Record<string, string> | null | undefined,
): void {
  activeHeaders = headers && Object.keys(headers).length > 0 ? headers : null;
}

/** Forget per-source state (signed URLs rotate per episode). */
export function resetPrefetch(): void {
  warmed.clear();
  failed.clear();
  queued.length = 0;
}

/**
 * Warm the HTTP cache for the given segment URLs (absolute, in play order).
 * Safe to call repeatedly: already-warmed and known-failed URLs are skipped,
 * and at most MAX_WARM_PER_CALL new fetches are queued per call so a seek
 * storm can't enqueue the whole episode.
 */
export function warmSegments(urls: string[]): void {
  const targets = urls
    .filter((url) => url && !warmed.has(url) && !failed.has(url))
    .slice(0, MAX_WARM_PER_CALL);
  for (const url of targets) {
    warmed.add(url);
    queued.push(() => {
      fetch(url, {
        headers: activeHeaders ?? undefined,
        cache: 'default',
        // Prefetches must never race the player into a Priority=Low queue —
        // they are the point.
        priority: 'high',
      } as RequestInit)
        .then((res) => {
          if (!res.ok) failed.add(url);
          // Body intentionally left unconsumed: the response is served from
          // the HTTP cache to hls.js's own request later.
        })
        .catch(() => failed.add(url))
        .finally(() => {
          inFlight -= 1;
          pump();
        });
    });
  }
  pump();
}
