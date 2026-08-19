# Watch playback continuity investigation

## Reported behavior

Viewers report that browser playback reconnects during an episode, interrupts viewing, and fails to retain the expected forward buffer reserve.

## Initial evidence

The production Attack on Titan Episode 1 probe reached normal server selection (`ally`) and was still resolving the playable media element at the time of capture. The local Watch implementation uses hls.js for HLS sources with a 45–120 second forward-buffer policy, so the size policy alone does not initiate player recreation.

The initial code audit identified two independent recovery owners. ArtPlayer defaults to five `video:error` reconnects and rewrites `art.url` on each retry, which restarts the custom media source. The Watch page separately owns hls.js error handling and calls `startLoad()` for fatal network failures before provider refresh/failover. This overlap can repeatedly rebuild or reload a stream that already holds buffered media, matching the reported reconnection loop and buffer loss.

## Investigation rule

Any correction must give HLS network recovery a single owner, preserve the existing media element and buffered range across transient failures, and reserve full player rebuilds for conclusive source expiry or a manual provider/quality change.

## Implemented local correction

The Watch player now removes ArtPlayer's internal `video:error` listener after player creation, so it cannot repeatedly assign `art.url` and flush HLS MediaSource data. hls.js now owns bounded transient retry policies for manifests, playlists, and fragments. Hard signed-URL or throttling statuses (401, 403, 404, 410, 429) bypass retries; temporary gateway responses such as 502 remain retryable. The outer Watch code no longer calls `hls.startLoad()` after hls.js has exhausted its own network retries, preventing restart loops. Native HLS fallback uses the same buffer and retry policy.

## External implementation evidence

ArtPlayer documents a default maximum of five automatic reconnection attempts and a one-second reconnect delay. Its installed v5.4 implementation confirms that each `video:error` sets `art.url = option.url`, which reloads the source rather than preserving the active HLS buffer. Source: <https://artplayer.org/document/en/advanced/global.html>.

hls.js documents that non-fatal errors already recover internally, while `startLoad()` is intended for a fatal network error only after the library's configured retry policies are exhausted. Its v1.6 configuration exposes dedicated `fragLoadPolicy`, `playlistLoadPolicy`, and `manifestLoadPolicy` retry budgets; the legacy `fragLoadingMaxRetry`/related properties translate into those policies. Sources: <https://github.com/video-dev/hls.js/blob/master/docs/API.md> and <https://hlsjs-dev.video-dev.org/api-docs/hls.js.hls.recovermediaerror>.
