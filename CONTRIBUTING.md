# Contributing to Aniraku

Thanks for your interest in contributing! This guide covers the frontend codebase. The backend is a separate Go service — see the backend repo for its contribution guide.

## Development Setup

### Prerequisites

- **Node.js** 18+
- **npm** (or pnpm / yarn)

### Setup

1. **Fork** and **clone** the repo

   ```bash
   git clone https://github.com/YOUR_USERNAME/Aniraku.git
   cd Aniraku
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **(Optional) Configure environment variables**

   Create a `.env` file:

   ```env
   VITE_API_URL=http://127.0.0.1:43211      # Local backend (or omit for production)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   The app works without these — it falls back to the production backend and read-only mode.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Opens at `http://localhost:3000`.

## Project Structure

```
aniraku/
├── index.html              # HTML shell (CSP, OG, JSON-LD, PWA)
├── vercel.json             # Vercel routes, headers, env
├── vite.config.js          # Vite build config
├── middleware.js            # Vercel edge middleware (bot SEO)
├── public/                 # Static assets
├── scripts/                # Sitemap generator
└── src/
    ├── main.jsx            # Entrypoint (React root + QueryClient)
    ├── App.jsx             # Router, routes, error boundary, lazy loading
    ├── config.js           # API_BASE / PROXY_BASE
    ├── index.css           # CSS variables, global resets, utilities
    ├── components/         # Reusable UI components
    ├── hooks/              # Custom React hooks
    ├── lib/                # AniList client, Supabase, SEO, avatars
    └── pages/              # Route-level page components
```

### Key Files

| File                     | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `src/App.jsx`            | All routes defined here with `React.lazy` code-splitting  |
| `src/lib/anilist.js`     | AniList GraphQL client + queries (browse, detail, trend)  |
| `src/lib/seo.js`         | Dynamic `document.title`, meta tags, JSON-LD per route    |
| `src/lib/supabase.js`    | Supabase client (auth, watch history, notifications)      |
| `src/config.js`          | Backend API URL — change `VITE_API_URL` for local testing |
| `src/hooks/useAnime.js`  | React Query hooks wrapping AniList queries                |
| `src/hooks/useAuth.jsx`  | Auth context (login, signup, profile, session)            |
| `src/pages/Watch.jsx`    | Artplayer + hls.js video player, episode browser          |

### Styling

- **styled-components** for component-level styles
- CSS custom properties in `src/index.css` (`--bg`, `--accent`, `--border`, etc.)
- Always-on dark theme
- Mobile-first responsive breakpoints (480px, 768px, 1024px)
- Touch-friendly: 44px minimum tap targets, `-webkit-tap-highlight-color: transparent`

## Guidelines

- **Keep it simple.** No over-engineering.
- **Follow the existing patterns** — styled-components for styles, React Query for data, hooks for logic.
- **Test on mobile.** Use Chrome DevTools device toolbar at 375px width.
- **Test with multiple anime** — popular ongoing (e.g., One Piece), finished (e.g., Frieren), and older titles.
- **Maintain accessibility** — semantic HTML, aria labels, keyboard navigation.
- **Don't break the SEO helper.** If you add a new page, add a `set*SEO()` function in `src/lib/seo.js`.
- **One PR per feature or fix.**

## Adding a New Page

1. Create your page component in `src/pages/`
2. Add a lazy import and route in `src/App.jsx`
3. Add SEO metadata if public-facing (use `src/lib/seo.js`)
4. If it's a new top-level navigation item, add it to `NavBar.jsx` and `SideBar.jsx`

## Pull Requests

- PRs should target the `main` branch.
- Write clear, descriptive PR titles and descriptions.
- Reference any related issues (e.g., `Closes #42`).
- Ensure the dev server starts and builds without errors.
- Screenshots are appreciated for UI changes.

## Reporting Issues

Use [GitHub Issues](https://github.com/Aniraku/Aniraku/issues). Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS
- Screenshots if applicable

For streaming/playback issues, include the anime title and episode number.

## License

By contributing, you agree your code is licensed under [MIT](LICENSE).
