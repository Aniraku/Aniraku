// Segment pool — parallel prefetch + a fragment loader that serves hls.js
// from memory, for buffer-free playback.
//
// hls.js loads fragments strictly one-by-one; on a cold cache the buffer
// only grows at network latency speed. This module changes the economics:
//
//   1. A prefetch driver runs ahead of the playhead over hls.js's own
//      fragment list, fetching the next segments with a bounded worker
//      pool — several requests in flight at once instead of one.
//   2. A custom fragment loader (hls.js `fLoader`, created via
//      createPooledFragLoader) serves those pooled bytes to hls.js
//      instantly. Requests with no pooled copy fall through to hls.js's
//      normal network loader, so worst case equals stock playback.
//
// Safety properties (learned from the buffer-cap revert — playback must
// never be hostage to an experiment):
//   - hls.js internals are untouched; the loader delegates to
//     Hls.DefaultConfig.loader for every pool miss, abort and destroy.
//   - Pool entries that fail are dropped — the loader transparently falls
//     back to the network for that fragment.
//   - Byte-range fragments (EXT-X-BYTERANGE) are pooled per exact range.
//   - ABR stays honest: pool hits report the REAL prefetch timings as
//     stats, not instant-zero, so the bandwidth estimator isn't poisoned.
//   - Memory is capped: delivered entries are evicted FIFO once the pool
//     exceeds the byte budget.

const MAX_POOL_BYTES = 48 * 1024 * 1024; // ~48 MiB of pooled segments
const DEFAULT_AHEAD_COUNT = 8;

interface PoolEntry {
  promise: Promise<ArrayBuffer>;
  bytes: number;
  createdAt: number;
  /** True once hls.js has consumed this entry (evict first). */
  delivered: boolean;
  /** Stats captured at fetch time — replayed to hls.js on delivery. */
  trequest: number;
  tfirst: number;
  tload: number;
}

let pool = new Map<string, PoolEntry>();
let poolBytes = 0;
let generation = 0; // bumped on reset — stale completions ignore themselves
let inFlight = 0;
const queue: (() => void)[] = [];
let maxInFlight = 3;
let activeHeaders: Record<string, string> | null = null;

function rangeKey(
  url: string,
  rangeStart?: number,
  rangeEnd?: number,
): string {
  if (rangeStart == null) return url;
  return `${url}::${rangeStart}-${rangeEnd ?? ''}`;
}

function evictIfNeeded(): void {
  if (poolBytes <= MAX_POOL_BYTES) return;
  // Delivered entries first (hls.js already consumed them), then oldest.
  for (const pass of [true, false]) {
    for (const [key, entry] of pool) {
      if (poolBytes <= MAX_POOL_BYTES) return;
      if (pass !== entry.delivered) continue;
      poolBytes -= entry.bytes;
      pool.delete(key);
    }
  }
}

function pump(): void {
  while (inFlight < maxInFlight && queue.length > 0) {
    const job = queue.shift();
    if (!job) return;
    inFlight += 1;
    void job();
  }
}

/** Update the request headers used by prefetch fetches (CDN Referer etc). */
export function configureSegmentPool(
  headers: Record<string, string> | null | undefined,
): void {
  activeHeaders = headers && Object.keys(headers).length > 0 ? headers : null;
}

/** Forget all pooled state (signed URLs rotate per source/episode). */
export function resetSegmentPool(): void {
  generation += 1;
  pool = new Map();
  poolBytes = 0;
  inFlight = 0;
  queue.length = 0;
}

/** Look up a pooled fragment promise (does not consume it). */
export function peekSegment(
  url: string,
  rangeStart?: number,
  rangeEnd?: number,
): Promise<ArrayBuffer> | undefined {
  return pool.get(rangeKey(url, rangeStart, rangeEnd))?.promise;
}

function fetchIntoPool(
  key: string,
  url: string,
  rangeStart?: number,
  rangeEnd?: number,
): void {
  if (pool.has(key)) return;
  const gen = generation;
  const headers: Record<string, string> = { ...(activeHeaders ?? {}) };
  if (rangeStart != null) {
    // hls.js byteRange is [start, end) — the end is EXCLUSIVE (its own
    // loader sends `bytes=start-(end-1)`). Match it byte-for-byte.
    headers['Range'] =
      rangeEnd != null
        ? `bytes=${rangeStart}-${rangeEnd - 1}`
        : `bytes=${rangeStart}-`;
  }
  const trequest = performance.now();
  const promise = (async () => {
    const res = await fetch(url, {
      headers,
      cache: 'default',
      priority: 'high',
    } as RequestInit);
    if (!res.ok) throw new Error(`segment prefetch ${res.status}`);
    const buf = await res.arrayBuffer();
    // Server ignored the Range header → slice to the exact window.
    if (rangeStart != null && rangeEnd != null) {
      return buf.slice(rangeStart, rangeEnd);
    }
    return buf;
  })();

  const entry: PoolEntry = {
    promise: promise.then((buf) => buf),
    bytes: 0,
    createdAt: Date.now(),
    delivered: false,
    trequest,
    tfirst: 0,
    tload: 0,
  };
  pool.set(key, entry);
  void promise
    .then((buf) => {
      if (gen !== generation) return;
      const now = performance.now();
      const e = pool.get(key);
      if (e && e.promise === promise) {
        e.bytes = buf.byteLength;
        // Honest ABR stats: the timings of the actual prefetch, not zeros.
        e.tfirst = now;
        e.tload = now;
      }
      poolBytes += buf.byteLength;
      evictIfNeeded();
    })
    .catch(() => {
      if (gen === generation) {
        const e = pool.get(key);
        poolBytes -= e?.bytes ?? 0;
        pool.delete(key);
      }
    })
    .finally(() => {
      inFlight -= 1;
      pump();
    });
}

export interface PrefetchFragment {
  url: string;
  /** hls.js byteRange tuple [start, end] for EXT-X-BYTERANGE fragments. */
  byteRange?: [number, number];
}

/**
 * Prefetch the given fragments (absolute URLs, in play order). Skips
 * anything already pooled or in flight; at most `count` NEW fetches are
 * queued per call so a seek storm can't enqueue the whole episode.
 */
export function prefetchSegments(
  fragments: PrefetchFragment[],
  count: number = DEFAULT_AHEAD_COUNT,
): void {
  let queuedCount = 0;
  for (const frag of fragments) {
    if (queuedCount >= count) break;
    const key = rangeKey(frag.url, frag.byteRange?.[0], frag.byteRange?.[1]);
    if (pool.has(key)) continue;
    fetchIntoPool(key, frag.url, frag.byteRange?.[0], frag.byteRange?.[1]);
    queuedCount += 1;
  }
  pump();
}

/**
 * Fragment loader that serves pooled segments to hls.js from memory.
 *
 * SUBCLASSES hls.js's default loader rather than wrapping it: abort() and
 * destroy() stay the stock implementations (a wrapping wrapper that
 * forwards abort re-enters hls.js's resetLoader and blows the call stack).
 * Only load() is overridden — pool hits are served from memory, everything
 * else runs the stock network path.
 * `HlsCtor` is injected (not imported) to keep hls.js out of this chunk.
 */
export function createPooledFragLoader(HlsCtor: any): any {
  const Base = HlsCtor.DefaultConfig.loader;

  return class PooledFragLoader extends Base {
    load(context: any, loaderConfig: any, callbacks: any): void {
      const key = rangeKey(context.url, context.rangeStart, context.rangeEnd);
      const entry = pool.get(key);
      if (!entry) {
        // Pool miss → stock network loading path (inherited).
        super.load(context, loaderConfig, callbacks);
        return;
      }

      void entry.promise
        .then((data) => {
          if (this.aborted || this.destroyed) return;
          const e = pool.get(key);
          const trequest = e?.trequest ?? entry.trequest;
          const tfirst = e?.tfirst ?? entry.tfirst;
          const tload = performance.now();
          this.stats = {
            ...this.stats,
            trequest,
            tfirst,
            tload,
            loaded: data.byteLength,
            total: data.byteLength,
            loading: { start: trequest, first: tfirst, end: tload },
          };
          // Mark delivered so eviction prefers this entry first.
          if (e && e.promise === entry.promise) e.delivered = true;
          callbacks.onSuccess(
            { url: context.url, data },
            this.stats,
            context,
            null,
          );
        })
        .catch(() => {
          if (this.aborted || this.destroyed) return;
          // Pooled fetch failed → transparent network fallback.
          super.load(context, loaderConfig, callbacks);
        });
    }
  };
}
