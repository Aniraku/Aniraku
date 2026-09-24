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
- **`src/pages/Watch.tsx`** — the big one. Artplayer setup, HLS streaming, server selection, episode sidebar, keyboard shortcuts, resume positions, the works (~1800 lines, take your time with it).
- **`src/pages/Info.tsx`** — the title page: metadata, stats, characters, relations, recommendations (~4000 lines).
- **`src/styles/globals.css`** — CSS custom properties for the entire dark theme (`--global-*`).
- **`src/components/global-chrome.css`** — chrome overrides (footer, legal links, nav) that must keep loading after `globals.css`.

Styles are done with styled-components plus plain CSS files next to their components.

## Things to keep in mind

- The site is mobile-first. Test at 375px width. Minimum tap targets are 44px.
- Dark theme only. Don't add light mode.
- Don't rename existing `localStorage` keys (the `miruro:*` namespace) — users would lose their saved settings and history.
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
