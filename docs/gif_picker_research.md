# Anime GIF picker integration

The comment and reply composers now use the public [OtakuGIFs API](https://otakugifs.xyz/api) instead of a static third-party GIF list. This provides a larger, anime-specific reaction catalogue without embedding media assets in the repository.

| API endpoint | Purpose | Integration behavior |
| --- | --- | --- |
| `GET https://api.otakugifs.xyz/gif/allreactions` | Returns the full list of supported reactions. | Powers client-side reaction search. |
| `GET https://api.otakugifs.xyz/gif?reaction={reaction}&format=GIF` | Returns one randomized GIF URL for the requested reaction. | Populates reaction previews and selects a GIF for a comment. |

The picker presents eighteen popular reactions by default, including happy, hug, laugh, blush, smug, cry, wink, celebrate, dance, pat, pout, stare, shy, and airkiss. Users can search the full API catalogue for additional reactions such as `headbang`, `facepalm`, `thumbsup`, `sweat`, and `surprised`.

The implementation lazily obtains preview URLs, caches fetched reaction URLs for the active session, includes accessible labels, remains scrollable within a mobile-safe popover, and keeps touch feedback on each tile. Vercel’s Content Security Policy explicitly permits `https://api.otakugifs.xyz`; returned image URLs are already covered by the existing HTTPS image policy.
