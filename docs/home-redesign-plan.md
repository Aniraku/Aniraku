# Aniraku Home Redesign Plan

## Design direction

The revised Home will use an **editorial streaming index** rather than a stack of heavy bordered panels. It keeps Aniraku’s near-black background, off-white typography, and signal-red accent, but gives anime art and concise episode information visual priority. The result should feel dense, fast to scan, and purpose-built for choosing what to watch next.

## Screen hierarchy

| Order | Module | Data source | Purpose |
|---|---|---|---|
| 1 | Featured trend | Unified backend-proxied trending + movie feed | One decisive entry point with Watch and Details actions. |
| 2 | Fresh from the season | Airing records | A broad poster rail for currently releasing shows. |
| 3 | Airing next | Real `nextAiringEpisode` timestamps | Compact schedule strip with episode and local time information. |
| 4 | Continue watching | Existing signed-in local/profile-aware component | Preserves personal momentum without taking over the Home page. |
| 5 | Trending right now | Unified backend-proxied trend feed | Offers current series and movies beyond the headline title. |
| 6 | Top series this week | Backend-proxied top TV results | Presents high-score series as a durable discovery lane. |
| 7 | Movie night | Backend-proxied movie results | Provides a clearly scoped one-sitting discovery path. |
| 8 | Browse by mood | Existing Catalog genre routes | Maintains fast genre entry points. |

## Responsive rules

The desktop hero uses a wide 16:9 cinematic treatment. Its adjacent metadata never competes with the hero; schedule information moves below it instead. Rails use responsive poster widths, horizontal touch scrolling, and no desktop-only controls. On phones, the hero shifts to a portrait-backed composition, cards retain readable metadata, and each section remains usable with one hand.

## Explicit exclusions

The redesign will not add a post feed, comment feed, community feed, copied labels, copied content, copied images, or copied source code from the reference website. It will not change authentication, Anime Detail, Watch playback, or the backend-only AniList policy.
