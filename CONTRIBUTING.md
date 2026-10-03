# Contributing

Hey, thanks for wanting to help out. This is the frontend repo — a React app that talks to AniList for metadata and to our streaming backend for playback. Here's how to get started.

## Getting set up

1. Fork and clone the thing
2. `npm install`
3. `npm run dev` — that's it, you should see the site at `http://localhost:3000`

If you want auth, bookmarks, and watch history to work locally, copy `.env.example` to `.env.local` and fill it in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Don't have Supabase set up? No worries — browsing, searching, and watching all work without it. The app falls back to read-only mode gracefully.

If you're also running the streaming backend locally, point to it:

```env
VITE_BACKEND_URL=http://127.0.0.1:43211/
```

Otherwise it'll use the production backend (`https://api.aniraku.tech/`) automatically.

## How the code is organized

A few files worth knowing about before you dive in:

- **`src/App.tsx`** — every route is here. Pages are lazy-loaded with `React.lazy` so they code-split.
- **`src/hooks/useApi.ts`** — the AniList GraphQL fetch wrapper, with a fallback to the backend proxy if CORS gets in the way. Also defines `ANIRAKU_API_BASE`.
- **`src/providers/AuthProvider.tsx`** — Supabase auth state: sign-up, sign-in, session refresh, profile sync.
- **`src/lib/supabase.ts`** — the Supabase client.
- **`src/lib/watchEvents.ts`** — the ONLY way watch history gets written (`recordWatchEvent`: both episode stores + timestamp + bookmark status, pause-aware).
- **`src/lib/listStatus.ts`** — the six bookmark statuses (Watching → Completed → Rewatching…) and provider mappings.
- **`src/lib/displayLanguage.ts`** — title/character display language resolution (slugs must never use this).
- **`src/lib/sync.ts`** — Supabase transport: history merge engine, bookmarks, notifications, import/export runner.
- **`src/pages/Watch.tsx`** — the big one. Episode state, server pools (`serversSub`/`serversDub`), `${lang}:${name}` selection, language hide-rule + auto-fallback, fallback tracking, history recording, keyboard shortcuts (~2100 lines, take your time with it).
- **`src/components/Watch/Video/Player.tsx`** — Artplayer setup, HLS/embed playback, candidate fallback chain, playing-source identity reports (~4600 lines).
- **`src/components/Watch/Video/MediaSource.tsx`** — server/language picker (hide-absent-languages, AUTO badge), count pills, report modal (~1000 lines).
- **`src/pages/Info.tsx`** — the title page: metadata, stats, characters, relations, recommendations (~4000 lines).
- **`src/styles/globals.css`** — CSS custom properties for the entire dark theme (`--global-*`).
- **`src/components/global-chrome.css`** — chrome overrides (footer, legal links, nav) that must keep loading after `globals.css`.

Styles are done with styled-components plus plain CSS files next to their components.

## Branches — read this before opening a PR

- Feature work targets **`preview/mal-v4.4.1-beta`** (deploys to `test.aniraku.tech`).
- **`main`** (deploys to `www.aniraku.tech`) advances by merging preview, and it must stay on the **official AniList API** (`https://graphql.anilist.co`) while preview uses the **mirror** (`https://graphql.aniraku.tech`). The only sanctioned differences are 4 code reads (`useApi.ts`, `Info.tsx`, `sync.ts`, `generate-sitemap.mjs`) + the CSP line in `vercel.json`. If your diff touches those files, say so in the PR.
- Never commit `.env.production` or `.freebuff/` — local-only, git-ignored, once purged from history.
- The full flow map lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — read the section for whatever you're changing (player, history, sync, statuses).

## Things to keep in mind

- The site is mobile-first. Test at 375px width. Minimum tap targets are 44px.
- Dark theme only. Don't add light mode.
- Storage keys live under the `aniraku:` namespace. A one-time boot
  migration (`src/lib/storageMigration.ts`) copies pre-swap `miruro:*` keys
  forward — never introduce new `miruro:` references; users would lose their
  saved settings and history.
- One PR per thing. Small changes are easier to review.
- Test with a few different anime — something popular and currently airing, something old, something obscure. The backend handles them differently.

## Adding a new page

1. Make your component in `src/pages/`
2. Lazy-import it in `src/App.tsx` and add a route
3. Set the page title (each page sets `document.title` in an effect)
4. If it belongs in the nav, add it to `Navbar.tsx` / `SideMenu.tsx`

## Pull requests

A quick checklist before you open one:

- `npm run dev` starts without errors
- `npm run build` completes clean
- `npm run lint` passes
- Works on mobile (375px) and desktop
- No console errors
- If it's a UI change, throw in a screenshot

## Reporting bugs

Use the [bug report template](https://github.com/Aniraku/Aniraku/issues/new?template=bug_report.yml). Include what browser and device you're on, and if it's a playback issue, which anime and episode.

## License

By contributing you agree your stuff is licensed the same as the rest of the project — see [LICENSE](LICENSE).
