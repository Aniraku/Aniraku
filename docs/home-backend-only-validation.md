# Local Home and Anime Detail Validation Notes

## Root Home route

On 23 August 2026, the local Vite preview at `http://127.0.0.1:3001/` was checked after data settled. The former Random Anime Pick hero rendered the AniList-backed **Trending anime** selector with a real `BLEACH: Thousand-Year Blood War - The Calamity` record, while the companion **Trending movies** control remained available in the hero.

The page also rendered real backend-proxied records for On deck, Seasonal momentum, Community favorites, editorial picks, Screening room, and Movie radar. The local process occupies port `3001` only because the sandbox's port `3000` is held by a separate service; the Vite configuration itself remains set to port `3000`.

The root URL `http://127.0.0.1:3001/` is the sole Home route, and all visible header and footer Home controls link to `/`. The former `http://127.0.0.1:3001/home` path was intentionally rechecked after route removal and now renders the site’s not-found page rather than a Home redirect.

## Unified trending hero

The locally served Home route was checked again after the hero refinement. Its populated headline used a single **Trending now** label and a combined, de-duplicated backend-derived trend feed spanning the existing series and movie results. The former **Trending anime** and **Trending movies** selector buttons were absent from the rendered hero.

## Data-policy result

Home requests use the Aniraku backend proxy. Anime Detail metadata is requested directly from `https://miruro-api-v3.onrender.com/info/:anilist_id`, while its real episode list is requested separately from Aniraku’s backend endpoint `/api/v1/anime/:id/episodes`; the browser does not construct episode rows or use an AniList GraphQL detail fallback.

## Anime Detail route

The local Anime Detail route for `Tamon's B-Side` (AniList ID `178005`) loaded the backend metadata title, cover, synopsis, score, format, genres, and 13 backend episode rows. The visible rows carried the returned episode titles, including `You Need Money to Support Your Oshi`, `Do You Like Me?`, and `FLY`; the page only exposed **Watch Now** after the real episode collection was present.

For the previously failing ID `111762`, the local Anime Detail route loaded title, cover, banner, score, format, description, genres, relations, and recommendations from `https://miruro-api-v3.onrender.com/info/111762`. Its real 25-row episode list also loaded directly from `https://miruro-api-v3.onrender.com/episodes/111762`, combining only genuine provider records by their supplied episode numbers. The detail skeleton remained during the initial load, the obsolete text claiming Aniraku backend episode loading was absent, and no episode rows were fabricated. The direct Miruro endpoints permitted CORS access for both the production and local development origins during validation.

The Relations tab was then opened and rendered direct results from `https://miruro-api-v3.onrender.com/anime/111762/relations`: the valid anime-only **PREQUEL** and **SEQUEL** cards for Fruits Basket were present. Direct metadata, episode, and relation requests therefore all resolved independently of Aniraku’s former detail data endpoints. The detail title also remained contained within the banner on the desktop review route.
