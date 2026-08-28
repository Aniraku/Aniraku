# AniList direct-client research

Source: https://docs.anilist.co/guide/rate-limiting

The official AniList documentation states that the normal API limit is 90 requests per minute, but the API is currently in a degraded state and temporarily limited to 30 requests per minute. Responses expose `X-RateLimit-Limit` and `X-RateLimit-Remaining`. After exceeding the limit, AniList applies a one-minute timeout; responses during the timeout can include `Retry-After` (seconds) and `X-RateLimit-Reset` (Unix timestamp). AniList also has a burst limiter. The official page says increased limits are not currently being accepted.

Implementation implication: direct clients must reduce request volume using cache, in-flight request deduplication, bounded concurrency, a client-local pacing gate, stale-while-revalidate behavior where safe, and explicit handling of 429/reset headers. No attempt should spoof or bypass AniList controls; moving requests client-side only distributes traffic by user IP and does not remove the per-client limit.

Source: https://docs.anilist.co/guide/considerations

AniList says severe outages may reduce limits or temporarily suspend access; unavailable responses can be HTTP 403 with a GraphQL error. It also warns that excessive requests from a single IP may result in manual IP blocking. Implementation implication: do not try to spoof headers, rotate proxies, or otherwise bypass controls. Prefer fewer, larger GraphQL queries, client-local pacing, and friendly degraded states. Adult-content filtering should remain explicit because AniList cannot guarantee filtering accuracy.
