# Aniraku

<p align="center">
  <img src="public/og-image.svg" alt="Aniraku" width="600" />
</p>

<p align="center">
  <strong>Open-source anime streaming platform</strong> — watch anime online for free in HD with subtitles and dubs.
</p>

<p align="center">
  <a href="https://aniraku.vercel.app"><strong>aniraku.vercel.app</strong></a>
  ·
  <a href="https://discord.gg/aniraku">Discord</a>
  ·
  <a href="https://github.com/Aniraku/Aniraku/issues">Report Bug</a>
</p>

---

## Features

- **🎬 Multi-source streaming** — SUB and DUB sources with automatic fallback
- **🎨 Modern UI** — Clean, responsive, always-on dark theme with mobile-first design
- **📺 Artplayer** — Custom video player with skip intro, playback rate, PiP, fullscreen, hotkeys, subtitle size control, and theater mode
- **🕓 Watch history** — Auto-saves progress locally and syncs to your account
- **🔍 Catalog & search** — Browse by genre, format, status, season, and year with instant search (⌘K)
- **📅 Airing schedule** — Daily schedule view showing when your favorite anime air next
- **⭐ Trending & top rated** — Discover popular, top rated, and currently airing anime
- **📱 PWA ready** — Install as a standalone app on mobile and desktop
- **🚀 SEO optimized** — Dynamic meta tags, Open Graph, Twitter Cards, JSON-LD structured data, sitemap generation
- **🔐 Supabase Auth** — Login, signup, profile, bookmarks, and notifications
- **➕ More** — Random anime picker, NSFW gate, genre chips, relation browsing, similar recommendations

## Tech Stack

| Layer               | Technology                                                       |
| ------------------- | ---------------------------------------------------------------- |
| Framework           | [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)  |
| Routing             | [React Router v6](https://reactrouter.com/)                      |
| Styling             | [styled-components](https://styled-components.com/)              |
| State / Caching     | [TanStack React Query v4](https://tanstack.com/query/v4)         |
| Video Player        | [Artplayer 5](https://artplayer.org/) + [hls.js](https://github.com/video-dev/hls.js/) |
| Auth & DB           | [Supabase](https://supabase.com/) (PostgreSQL + JWT)              |
| Metadata            | [AniList GraphQL API](https://anilist.co/graphiql)               |
| SPA SEO             | Custom dynamic meta/JSON-LD helper                               |
| Deployment          | [Vercel](https://vercel.com/) (aniraku.vercel.app)               |
| Backend             | Go API server (separate repo) at `aniraku-backend.onrender.com`  |

## Project Structure

```
aniraku/
├── public/                    # Static assets
│   ├── favicon.svg
│   ├── og-image.svg
│   ├── manifest.json          # PWA manifest
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── seo.js                 # Client-side SEO fallback
│   └── icons/                 # PWA icons (180, 192, 512)
├── scripts/
│   └── generate-sitemap.js    # Sitemap builder
├── src/
│   ├── main.jsx               # App entrypoint
│   ├── App.jsx                # Router + routes
│   ├── config.js              # API base URL config
│   ├── index.css              # Global styles & CSS variables
│   ├── components/
│   │   ├── Card/              # Anime card components
│   │   ├── Featured/          # Featured / hero section
│   │   ├── Footer/            # Site footer
│   │   ├── Hero/              # Hero banner
│   │   ├── Loader/            # Loading skeletons
│   │   ├── MultiSwiper/       # Swiper carousel wrapper
│   │   ├── NavBar/            # NavBar + SideBar
│   │   ├── Spinner/           # Loading spinner
│   │   └── Trending/          # Trending section
│   ├── hooks/
│   │   ├── useAnime.js        # AniList data hooks
│   │   ├── useAuth.jsx        # Supabase auth context
│   │   ├── useDebounce.js     # Debounce utility
│   │   ├── useLocalStorage.js # Persistent state
│   │   └── useMediaQuery.js   # Responsive breakpoints
│   ├── lib/
│   │   ├── anilist.js         # AniList GraphQL queries
│   │   ├── avatars.js         # Avatar generator
│   │   ├── seo.js             # Dynamic SEO metadata helper
│   │   └── supabase.js        # Supabase client
│   └── pages/
│       ├── Home.jsx           # Homepage (hero, trending, airing, movies, TV)
│       ├── Watch.jsx          # Video player + episode browser
│       ├── AnimeDetail.jsx    # Anime detail (banner, synopsis, episodes, relations)
│       ├── Catalog.jsx        # Browse / search / filter grid
│       ├── Schedule.jsx       # Weekly airing schedule
│       ├── Auth.jsx           # Login / signup
│       ├── Profile.jsx        # User profile
│       ├── Admin.jsx          # Admin dashboard
│       ├── Random.jsx         # Random anime picker
│       ├── Error.jsx          # 404 page
│       ├── Dmca.jsx           # DMCA policy
│       ├── Privacy.jsx        # Privacy policy
│       ├── License.jsx        # MIT license page
│       └── Terms.jsx          # Terms of service
├── index.html                 # HTML shell with CSP, OG, JSON-LD, PWA metas
├── middleware.js              # Vercel middleware (bot-facing SEO shells)
├── vercel.json                # Vercel deploy config (routes, headers, env)
├── vite.config.js             # Vite build config
└── package.json
```

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** (or pnpm / yarn)

### Local Development

```bash
# Clone the repo
git clone https://github.com/Aniraku/Aniraku.git
cd Aniraku

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the root (optional — defaults work for development):

```env
VITE_API_URL=http://127.0.0.1:43211        # Backend API (defaults to production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without Supabase credentials, the app runs in read-only mode (browsing + streaming still work; auth features are disabled).

### Production Build

```bash
npm run build          # Vite production build → dist/
npm run preview        # Preview the production build locally
```

### Scripts

| Script               | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start Vite dev server               |
| `npm run build`      | Production build                    |
| `npm run preview`    | Preview production build            |
| `npm run generate-sitemap` | Generate sitemap.xml          |

## Backend

This repository is the **React frontend only**. The streaming backend is a separate Go service deployed at `aniraku-backend.onrender.com`. It handles:

- Streaming source resolution (Miruro, Senshi, and others)
- Proxy for HLS manifests and subtitles
- AniList GraphQL proxy (avoids CORS issues)
- Rate limiting and abuse protection

The frontend communicates with the backend via the REST API configured in `src/config.js`.

## Deployment

This project is deployed on **Vercel** at [aniraku.vercel.app](https://aniraku.vercel.app).

### Deploy Your Own

1. Fork this repository
2. Import it on [Vercel](https://vercel.com/new)
3. Set environment variables (see above)
4. Deploy — Vercel auto-detects Vite and uses the config in `vercel.json`

## Routes

| Path                              | Page                    |
| --------------------------------- | ----------------------- |
| `/` `/home`                       | Homepage                |
| `/catalog`                        | Browse / search catalog |
| `/catalog?genre=Action`           | Genre filter            |
| `/catalog?sort=SCORE_DESC`        | Sorted catalog          |
| `/schedule`                       | Weekly airing schedule  |
| `/watch/:animeId-episode-:num`    | Video player            |
| `/anime/:id`                      | Anime detail page       |
| `/random`                         | Random anime picker     |
| `/login` `/signup`                | Authentication          |
| `/profile`                        | User profile            |
| `/admin`                          | Admin dashboard         |
| `/top-airing`                     | ↪ Redirects to catalog  |
| `/most-popular`                   | ↪ Redirects to catalog  |
| `/movies`                         | ↪ Redirects to catalog  |
| `/tv-series`                      | ↪ Redirects to catalog  |
| `/dmca` `/privacy` `/license` `/terms` | Legal pages        |

## Keyboard Shortcuts (Watch Page)

| Key         | Action                      |
| ----------- | --------------------------- |
| `Space`     | Play / Pause                |
| `←` / `J`   | Rewind 10s                  |
| `→` / `L`   | Forward 10s                 |
| `↑` / `↓`   | Volume up / down            |
| `F`         | Toggle fullscreen           |
| `T`         | Toggle theater mode         |
| `M`         | Mute / unmute               |
| `P`         | Picture-in-Picture          |
| `C`         | Cycle subtitles             |
| `D`         | Switch source (SUB/DUB)     |
| `N`         | Next episode                |
| `B`         | Previous episode            |
| `,` / `.`   | Playback speed down / up    |
| `Esc`       | Exit fullscreen / theater   |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, guidelines, and pulling in streaming sources.

## License

[MIT](https://github.com/Aniraku/Aniraku/blob/main/LICENSE) © Aniraku Contributors
