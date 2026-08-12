# Anime GIF picker integration

The comment and reply composers use the public [Gifukai API](https://gifukai.com/docs), a browser-compatible anime reaction service that does not require users to sign in or the site owner to configure an API key.

| Endpoint | Purpose | Picker behavior |
| --- | --- | --- |
| `GET https://api.gifukai.com/v1/actions` | Returns the live action catalogue and aliases. | Populates searchable reaction actions such as `hug`, `laugh`, `headpat`, `facepalm`, `dance`, and `wink`. |
| `GET https://api.gifukai.com/v1/{action}` | Returns a random curated anime GIF for an action. | Supplies lazy previews, source-anime metadata, and the GIF selected for a comment or reply. |

The picker loads a curated default set of popular reactions and dynamically expands to the provider’s live catalogue, which contains roughly seventy actions and aliases. It supports aliases such as `headpat`, `lol`, `flustered`, and `meow`, labels each loaded preview with its source anime, preserves keyboard access, and keeps touch targets safely sized for mobile users.

This frontend-only provider is intentionally limited to high-quality anime reactions. It does not advertise unsupported universal character search: a reliable every-title/every-character GIF index requires a provider with a developer credential or a first-party search service. The implementation is no-key, no-user-auth, and resilient: dynamic action discovery falls back to the popular action set if the provider is temporarily unavailable. Vercel’s Content Security Policy permits direct `https://api.gifukai.com` requests; returned CDN GIFs are covered by the existing HTTPS image policy.
