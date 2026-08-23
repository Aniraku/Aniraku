# Local Home and Anime Detail Validation Notes

## Root Home route

On 23 August 2026, the local Vite preview at `http://127.0.0.1:3001/` was checked after data settled. The former Random Anime Pick hero rendered the AniList-backed **Trending anime** selector with a real `BLEACH: Thousand-Year Blood War - The Calamity` record, while the companion **Trending movies** control remained available in the hero.

The page also rendered real backend-proxied records for On deck, Seasonal momentum, Community favorites, editorial picks, Screening room, and Movie radar. The local process occupies port `3001` only because the sandbox's port `3000` is held by a separate service; the Vite configuration itself remains set to port `3000`.

The compatibility URL `http://127.0.0.1:3001/home` was then checked and resolved to `http://127.0.0.1:3001/`. The visible header logo, header Home control, footer logo, and footer Home control all linked to `/` after the canonical-route cleanup.

## Unified trending hero

The locally served Home route was checked again after the hero refinement. Its populated headline used a single **Trending now** label and a combined, de-duplicated backend-derived trend feed spanning the existing series and movie results. The former **Trending anime** and **Trending movies** selector buttons were absent from the rendered hero.

## Data-policy result

Home requests use the Aniraku backend proxy. Anime Detail metadata is now requested from `/api/v1/anime/:id`, and its episode list is requested separately from `/api/v1/anime/:id/episodes`; the browser does not construct episode rows or use an AniList GraphQL detail fallback.

## Anime Detail route

The local Anime Detail route for `Tamon's B-Side` (AniList ID `178005`) loaded the backend metadata title, cover, synopsis, score, format, genres, and 13 backend episode rows. The visible rows carried the returned episode titles, including `You Need Money to Support Your Oshi`, `Do You Like Me?`, and `FLY`; the page only exposed **Watch Now** after the real episode collection was present.
