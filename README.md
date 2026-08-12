# Aniraku

Aniraku is an open-source anime discovery and viewing frontend focused on fast catalog browsing, rich metadata, personal libraries, and a responsive playback experience. The repository contains the Vite-powered React client; the companion service layer lives in [Aniraku-Backend](https://github.com/Aniraku/Aniraku-Backend).

## Product Surface

The client includes catalog and search views, seasonal schedules, trending and random discovery, anime detail pages, watch pages, profiles, bookmarks, watch history, authentication flows, settings, and legal/privacy pages. Playback supports provider selection, subtitle and dub presentation, HLS-compatible sources, and player controls implemented in the application’s watch experience.

## Verified Technology Stack

| Layer | Technology | Repository evidence |
|---|---|---|
| Frontend framework | React with JSX | `src/main.jsx`, `src/**/*.jsx` |
| Build tool | Vite | `vite.config.js`, `package.json` |
| Styling | CSS with project-level stylesheets | `src/index.css`, `src/**/*.css` |
| Routing and pages | React application pages and hooks | `src/pages/`, `src/hooks/` |
| Data and integrations | AniList and Supabase client modules | `src/lib/anilist.js`, `src/lib/supabase.js` |
| Client state and persistence | Custom hooks and synchronization helpers | `src/hooks/`, `src/lib/sync.js` |
| Delivery | Vercel configuration | `vercel.json` |
| Quality automation | GitHub Actions and repository contribution templates | `.github/workflows/`, `.github/` |

The stack table intentionally lists only technologies represented by the checked-in files. It does not infer services, libraries, or deployment behavior that are not declared in the repository.

## Local Development

Install the project dependencies using the package manager indicated by the repository lockfile, then start the Vite development server:

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Review the available scripts in `package.json` before adding automation or changing the deployment flow. Keep credentials and private service configuration outside the repository.

## Related Repositories

| Repository | Purpose |
|---|---|
| [Aniraku-Backend](https://github.com/Aniraku/Aniraku-Backend) | Go service for API, authentication, metadata, and streaming-provider coordination |
| [.github](https://github.com/Aniraku/.github) | Organization-wide profile, contribution templates, and community-facing guidance |

## Contributing and Responsible Use

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please preserve the project’s privacy, accessibility, responsive behavior, and responsible-use expectations. Review the repository’s [privacy policy](PRIVACY_POLICY.md) and legal pages before changing user-data or content-handling behavior.

## License

See [LICENSE](LICENSE) for the project’s license terms.
