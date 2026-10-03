# Aniraku Frontend — Architecture & Flow Guide

This is the contributor map of the whole app: where things live, how data
flows, and which rules you must not break. Read this before touching the
player, history, sync, or upstream integrations.

Repo: `Aniraku/Aniraku` (this repo, React + Vite + TypeScript).
Siblings: `Aniraku-Backend` (Go — streaming, sync, import/export),
`Aniraku-App` (Android), `anilist-offline-db` (metadata mirror).

---

## 1. Branches & deployment rules

| Branch | Deploys to | AniList metadata source | Rule |
|:--|:--|:--|:--|
| `main` | `www.aniraku.tech` (production) | Official public API `https://graphql.anilist.co` | Never point `main` at the mirror. |
| `preview/mal-v4.4.1-beta` | `test.aniraku.tech` (preview) | Mirror `https://graphql.aniraku.tech` (same schema, no rate limits) | Never point preview back at official. |

- Feature work targets **preview**. `main` advances by merging preview,
  then flipping the 4 metadata reads + CSP back to official (see §2).
- The two branches intentionally diverge on exactly 5 spots:
  `src/hooks/useApi.ts` (`ANILIST_GRAPHQL`), `src/pages/Info.tsx`
  (supplementary fetch), `src/lib/sync.ts` (`anilistBatchDetail`),
  `scripts/generate-sitemap.mjs` (`ANILIST_ENDPOINT`), and the
  `connect-src` line in `vercel.json`. Everything else must stay identical
  — if a merge touches anything outside those 5 spots plus your feature,
  stop and inspect.
- Authenticated AniList traffic (Apollo `Viewer`, OAuth) stays on the
  official API on both branches; only unauthenticated public reads differ.
- Never commit `.env.production` or `Any Hidden Folder` — both are git-ignored
  local-only files (see `2f9b9c0`). They were once purged from history;
  keep it that way.

## 2. Metadata reads (the 5 divergence spots)

Public AniList GraphQL is read in exactly 4 code sites + the sitemap
crawler. When you merge preview → main, these go back to official:

1. `src/hooks/useApi.ts` → `ANILIST_GRAPHQL`
2. `src/pages/Info.tsx` → supplementary media fetch
3. `src/lib/sync.ts` → `anilistBatchDetail` (new-episode notifications)
4. `scripts/generate-sitemap.mjs` → `ANILIST_ENDPOINT`
5. `vercel.json` → CSP `connect-src` (drop the mirror origin on main)

## 3. Watch page flow (`src/pages/Watch.tsx`, ~2100 lines)

The page owns episode state, server pools, and selection. The player
(`src/components/Watch/Video/Player.tsx`, ~4600 lines) only plays what
it is given and reports back.

```
episode (+?ep=N) → fetchAnirakuServers(id, ep, sub) ─┐
                 → fetchAnirakuServers(id, ep, dub) ─┤→ sanitize → pools
                                                     │   (serversSub / serversDub)
pools settled (poolEpKey === serverEpKey) ─→ language rule ─→ auto-select
  server ─→ srcOverride ─→ Player ─→ playback ─→ playing-source report ─→ picker
```

- **Pools.** Both languages are fetched for every episode (current lang
  first, other right after). `sanitizeServers` dedupes names and drops
  rows with nothing mountable (dead embeds, expired tokens). Pool-empty
  therefore means *no playable source*, never a fetch glitch — every
  consumer may treat it as ground truth.
- **Selection keys** are `${lang}:${name}` everywhere (Watch, MediaSource,
  Player KeyD/KeyS cycling). Backend names repeat across sub/dub — a bare
  name would collide pools. Never invent a second key format.
- **Language rule.** Once pools settle, the AUDIO menu lists only
  languages with servers (sub-only → Sub alone; dub-only → Dub alone).
  While loading, or when neither side has servers, both render as before.
- **Language auto-fallback.** If the saved language pool is empty but the
  other isn't, playback flips automatically. The flip is flagged with
  `autoLangFallbackRef` so the persist effect skips it — a sub-only
  episode never rewrites the user's saved Dub preference
  (`aniraku:anime:language:{id}` + legacy key).
- **Server auto-select.** First direct server of the current language,
  else first embed. Returns early on an empty pool (no cross-language
  snap — the language rule owns that decision).
- **Player gate** (`serverGateOpen`): pools stamped for THIS episode +
  a resolved selection (or a genuinely empty pool, letting the player's
  own `/stream` discovery own it). This gate fixed the restart bug where
  arriving pool data forced `srcOverride` onto an already-playing
  instance. Do not loosen it.
- **Fallback tracking (display-only).** Every applied stream URL is
  exact-matched against pool sources and reported up via
  `onPlayingSource({ key, lang, auto })`. `auto` is true only for
  genuine error fallbacks (`advanceOnError`, dead-override → `/stream`),
  never for fresh loads. Watch highlights the reported key in the
  server list (`activeServerKey`; null = follow the manual selection)
  and shows an AUTO badge while `autoPlaying`. Selection state is never
  rewritten, so no reload loop is possible. Manual picks and episode
  changes clear the tracking. Embed suppliers are deliberately untracked.

## 4. History system (one card per anime)

Three native stores + one timestamp map, all under plain (non-namespaced
for these) localStorage keys:

| Key | Content |
|:--|:--|
| `watched-episodes` | Unified: `Record<animeId, Episode[]>` — the ONLY store History, Continue Watching, and the sync engine read. |
| `watched-episodes-{animeId}` | Suffixed per-anime list — Info checkmarks + EpisodeList state read this. |
| `last-anime-visited` | `Record<animeId, {timestamp, titleEnglish, titleRomaji}>` — card ordering/titles. |
| `all_episode_times` | `Record<episodeKey, {currentTime, playbackPercentage}>` — resume positions. |
| `aniraku:episode-watch-times` | `Record<{animeId}-episode-{n}, ms>` — per-episode recency authority. |

Rules:

- **All writes go through `recordWatchEvent`** (`src/lib/watchEvents.ts`):
  both episode stores together (verified), timestamp stamp, bookmark
  status advance. It returns false (writes nothing) while history is
  paused. Never write these keys from anywhere else.
- **"Most recently watched" = max per-episode timestamp**, never array
  tail. Tail order breaks on rewatch and merge order. Both readers
  (`useWatchHistory.buildEntries`, `EpisodeCard`) share this rule with a
  tail fallback for pre-timestamp installs.
- **Paused = freeze everything**: lists, visits, playback saves
  (HLS + iframe), and uploads. Resume keys (`last-watched-*`) stay
  ungated so in-session resume still works.
- **Heal**: `healUnifiedHistory()` unions suffixed keys into the unified
  record at boot (`main.tsx`) and on login merge — pre-unification
  watches reappear instead of staying Info-only.
- **Server sync** (`src/lib/sync.ts` + `src/lib/watchHistory.ts`):
  merge-on-login (union by `animeId:episode`, max progress wins, ties to
  newest timestamp), throttled 10s diff-upsert against a fingerprint map,
  `publishHistoryNow` for immediate pushes. `reconcileLocalHistory`
  folds server rows (incl. their timestamps) back into the native
  stores and never lowers local progress.
- **Removal**: History/EpisodeCard remove from the unified store +
  server delete + fingerprint forget. Clearing additionally drops
  suffixed keys and the timestamp map; Settings snapshots all of them
  so Undo restores byte-exact History.

## 5. List statuses (the hidden bookmark mechanism)

Bookmarks carry one of six AniList-vocabulary statuses
(`src/lib/listStatus.ts`): `CURRENT` (Watching), `PLANNING` (Plan to
Watch), `COMPLETED`, `PAUSED`, `DROPPED`, `REPEATING` (Rewatching).

- Stored on the bookmark row (`status` + `total_episodes` columns);
  pre-column rows read as null and display as Watching.
- New bookmarks start `PLANNING`. Watch events advance:
  `PLANNING → CURRENT → COMPLETED` (needs a known total — never
  guessed), any post-completion watch → `REPEATING`. `DROPPED`/`PAUSED`
  are explicit user actions only, never derived.
- Surfaced read-only as filter chips + badges on Profile → Bookmarks.
- Import persists the provider's status per title and backfills
  status-less existing rows (never clobbering real local watch state);
  export writes the stored status back (AniList: all six; MAL: closest
  five, `REPEATING` rides as `watching`) and skips only exact
  status+progress+score matches. Both report per-status counts, rendered
  by `describeImport`/`describeExport`. Status decisions beyond that
  live in `Aniraku-Backend/internal/api/v1/importexport.go`.
- Supabase migration (run once per project):
  ```sql
  alter table public.bookmarks
    add column if not exists status text,
    add column if not exists total_episodes integer;
  ```

## 6. Supporting systems (read before touching)

- **Title/character language** (`src/lib/displayLanguage.ts`): the
  Settings dropdowns persist into `aniraku:settings`
  (`langTitle`/`langCharacter`) and every display site resolves through
  `resolveDisplayTitle` / `resolveCharacterName`. Slugs must NEVER use
  these — link stability lives in `pickTitle` (`src/utils/animePaths.ts`).
- **Theme**: Google Fonts (Rubik / Agbalumo / Orbitron) + a pre-paint
  theme bootstrap in `index.html`. CSP `script-src` hashes in
  `vercel.json` must be recomputed whenever inline scripts change.
- **PWA**: `skipWaiting` + `clientsClaim` so stale tabs can't run old
  bundles; `navigateFallbackDenylist` keeps SEO/static URLs out of the
  app shell.
- **Export runner** (`src/lib/sync.ts`): fire-and-forget background job,
  10 chunk-POSTs/min (6s spacing, volume-scaled to 120s), 5 attempts
  honoring `Retry-After`, completion/failure → Supabase `notifications`
  row + bell refresh. Job state in `aniraku:export-job` (reload marks
  mid-flight jobs `interrupted`; chunks are server-idempotent).
- **Upcoming/unreleased panel**: conservative triggers only (explicit
  status / future episode), exact old-Aniraku stage styling, and no
  backend requests for unreleased titles. `src/lib/upcomingMessages.ts`
  holds the verbatim fallback copy.

## 7. Gates & workflow

```bash
npm run dev      # localhost:3000 (keep alive: nohup npx vite --host)
npx tsc --noEmit # must be 0
npm run lint     # 0 errors (warnings pre-existing)
vite build       # must succeed; touched routes must transform (curl localhost:3000/<file> → 200)
```

- Commit identity: `-c user.name="Shoislam0311" -c user.email="sho.islam0311@proton.me"`.
- `noUnusedLocals` is on. Dark theme only, mobile-first (375px, 44px
  targets). Zero visible "Miruro" — the only sanctioned traces are the
  storage-migration module and its references.
- Manual passes happen on `test.aniraku.tech` (preview) and
  `www.aniraku.tech` (main) with pasted console logs/screenshots.
