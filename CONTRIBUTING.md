# Contributing

Hey, thanks for wanting to help out. This is the frontend repo — a React app that talks to an AniList for metadata and a small Go backend for streaming. Here's how to get started.

## Getting set up

1. Fork and clone the thing
2. `npm install`
3. `npm run dev` — that's it, you should see the site at `http://localhost:3000`

If you want auth, bookmarks, and watch history to work locally, make a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Don't have Supabase set up? No worries — browsing, searching, and watching all work without it. The app falls back to read-only mode gracefully.

If you're also running the backend locally, point to it:

```env
VITE_API_URL=http://127.0.0.1:43211
```

Otherwise it'll use the production backend automatically.

## How the code is organized

A few files worth knowing about before you dive in:

- **`src/App.jsx`** — every route is here. Pages are lazy-loaded with `React.lazy` so they code-split.
- **`src/lib/anilist.js`** — the GraphQL queries and a fetch wrapper that tries AniList directly first, then falls back to the backend proxy if CORS gets in the way.
- **`src/lib/seo.js`** — handles `document.title`, meta tags, Open Graph, and JSON-LD for every page. If you add a new public route, add a `set*SEO()` function here.
- **`src/hooks/useAnime.js`** — React Query hooks wrapping the AniList queries. Cached aggressively so we don't spam their API.
- **`src/hooks/useAuth.jsx`** — React context for the Supabase auth state.
- **`src/pages/Watch.jsx`** — the big one. Artplayer setup, HLS streaming, episode sidebar, keyboard shortcuts, touch gestures, resume positions, the works. It's ~1300 lines, take your time with it.
- **`src/index.css`** — CSS custom properties for the entire dark theme. `--bg`, `--accent`, `--border`, `--text-primary`, etc.

Styles are done with styled-components. Keep component styles in their own `*.style.js` files if you're adding a new component.

## Things to keep in mind

- The site is mobile-first. Test at 375px width. Minimum tap targets are 44px.
- Dark theme only. Don't add light mode.
- Don't break the SEO helper. New public page = new `set*SEO()` call.
- One PR per thing. Small changes are easier to review.
- Test with a few different anime — something popular and currently airing, something old, something obscure. The backend handles them differently.

## Adding a new page

1. Make your component in `src/pages/`
2. Lazy-import it in `src/App.jsx` and add a route
3. If it's public-facing, add SEO in `src/lib/seo.js`
4. If it belongs in the nav, add it to `NavBar.jsx` and `SideBar.jsx`

## Pull requests

A quick checklist before you open one:

- `npm run dev` starts without errors
- `npm run build` completes clean
- Works on mobile (375px) and desktop
- No console errors
- If it's a UI change, throw in a screenshot

## Reporting bugs

Use the [bug report template](https://github.com/Aniraku/Aniraku/issues/new?template=bug_report.yml). Include what browser and device you're on, and if it's a playback issue, which anime and episode.

## License

By contributing you agree your stuff is under MIT, same as the rest of the project.
