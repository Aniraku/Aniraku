# Local Home and Anime Detail Validation Notes

## Root Home route

On 23 August 2026, the local Vite preview at `http://127.0.0.1:3001/` was checked after data settled. The former Random Anime Pick hero rendered a compact, AniList-backed **Trending now** feature using genuine series and movie records from a unified trend feed.

The page also rendered real backend-proxied records for Now airing, Airing next, Continue Watching, trending, top series, Movie night, and Browse by mood. The local process occupies port `3001` only because the sandbox's port `3000` is held by a separate service; the Vite configuration itself remains set to port `3000`.

The root URL `http://127.0.0.1:3001/` is the sole Home route, and all visible header and footer Home controls link to `/`. The former `http://127.0.0.1:3001/home` path was intentionally rechecked after route removal and now renders the site’s not-found page rather than a Home redirect.

## Production route verification

After deployment of commit `246bf33`, `https://www.aniraku.tech/` rendered the compact discovery Home with its canonical root title. `https://www.aniraku.tech/home` rendered the dedicated Aniraku-themed not-found page, including recovery links to Home, Catalog, and Random, rather than redirecting to `/`.

The initial production Anime Detail check identified that the site Content Security Policy omitted the direct Miruro origin, causing a browser `TypeError` despite valid API responses. Commit `e969f6a` added the precise `https://miruro-api-v3.onrender.com` `connect-src` entry and a regression assertion. After its production deployment reached `READY`, the final live Fruits Basket route rendered direct metadata, all 25 genuine episode rows, and the direct PREQUEL and SEQUEL Relation cards.

The final post-correction route check also confirmed that `https://www.aniraku.tech/` remains the canonical populated Home page and `https://www.aniraku.tech/home` remains the branded not-found experience rather than a redirect.

## Unified trending hero

The locally served Home route was checked again after the hero refinement. Its populated headline used a single **Trending now** label and a combined, de-duplicated backend-derived trend feed spanning the existing series and movie results. The former **Trending anime** and **Trending movies** selector buttons were absent from the rendered hero.

## Data-policy result

Home requests use the Aniraku backend proxy. Anime Detail metadata, real episode rows, and relations are requested directly from `https://miruro-api-v3.onrender.com/info/:anilist_id`, `https://miruro-api-v3.onrender.com/episodes/:anilist_id`, and `https://miruro-api-v3.onrender.com/anime/:anilist_id/relations`; the browser does not construct episode rows or use an AniList GraphQL detail fallback.

## Anime Detail route

For the previously failing ID `111762`, the local Anime Detail route loaded title, cover, banner, score, format, description, genres, relations, and recommendations from `https://miruro-api-v3.onrender.com/info/111762`. Its real 25-row episode list also loaded directly from `https://miruro-api-v3.onrender.com/episodes/111762`, combining only genuine provider records by their supplied episode numbers. The detail skeleton remained during the initial load, the obsolete text claiming Aniraku backend episode loading was absent, and no episode rows were fabricated. The direct Miruro endpoints permitted CORS access for both the production and local development origins during validation.

The Relations tab was then opened and rendered direct results from `https://miruro-api-v3.onrender.com/anime/111762/relations`: the valid anime-only **PREQUEL** and **SEQUEL** cards for Fruits Basket were present. Direct metadata, episode, and relation requests therefore all resolved independently of Aniraku’s former detail data endpoints. The detail title also remained contained within the banner on the desktop review route.
