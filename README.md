<p align="center">
  <img src="./assets/aniraku-readme-hero.svg" alt="Aniraku — your next anime obsession" width="100%" />
</p>

<p align="center">
  <a href="https://www.aniraku.tech/"><strong>Open Aniraku</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/Aniraku/Aniraku-Backend"><strong>Backend</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="CONTRIBUTING.md"><strong>Contribute</strong></a>
</p>

<h1 align="center">Your next anime obsession, remembered.</h1>

<p align="center">
  <strong>Aniraku</strong> is an open-source anime discovery and viewing client for people who want a cleaner way to find something good, start quickly, and come back without losing their place.
</p>

<p align="center">
  <code>React</code> · <code>Vite</code> · <code>Artplayer</code> · <code>HLS.js</code> · <code>AniList</code> · <code>Supabase</code>
</p>

---

## Why it hits different

Aniraku is designed around one simple idea: anime sites should feel like a **personal space**, not a maze of tabs. The interface keeps discovery, playback, watch history, ratings, and comments connected, so the next episode is always one click away.

| Moment | What Aniraku does |
|:--|:--|
| **Find your next thing** | Browse a fast, filterable catalog with AniList metadata, schedules, recommendations, and search. |
| **Stay in the story** | Keep watch progress, personal episode ratings, bookmarks, and Continue Watching context close to the title. |
| **Press play, not buttons** | Use adaptive playback, server failover, subtitles, dubs, quality selection, 10-second seek controls, and intro/outro skipping. |
| **Make it yours** | Use a responsive interface that stays comfortable on desktop, tablets, iOS, Android, and touch devices. |

> **Built for the binge, but respectful of your focus.** No cluttered flow, no losing track of your episode, and no fake progress states.

---

## The experience, at a glance

```text
DISCOVER ──────────────► WATCH ──────────────► REMEMBER
Catalog & schedules       Player & controls       History & ratings
AniList metadata          HLS / quality / subs    Continue or Rewatch
Recommendations           Auto-next & auto-skip   Bookmarks & comments
```

The product surface is intentionally connected. When a viewer rates or finishes an episode, the title page can show the watched state, their rating, the next episode to continue, or a **Rewatch** action when the title is complete.

---

## Player energy

| Control | Built for |
|:--|:--|
| **Adaptive quality** | Prefer Auto quality while keeping provider resolutions available. |
| **Resilient playback** | Try compatible providers automatically when a source cannot start. |
| **Skip Intro / Outro** | Use verified timestamp data where available, with manual and automatic behavior. |
| **Progress that follows you** | Resume partially watched titles, continue after later completed episodes, and rewatch completed shows. |
| **Sub, dub, and captions** | Switch language, source, subtitle behavior, speed, and player preferences in context. |

---

## Built in the open

```text
Browser
  │
  ├─ React + Vite application
  │    ├─ TanStack Query
  │    ├─ styled-components
  │    ├─ Artplayer + HLS.js
  │    └─ AniList metadata client
  │
  ├─ Supabase
  │    └─ Auth, profiles, bookmarks, history, comments
  │
  └─ Aniraku backend
       └─ Playback resolution, provider coordination, sync endpoints
```

The frontend source of truth lives in [`src/`](src/). The service boundary is maintained separately in [Aniraku-Backend](https://github.com/Aniraku/Aniraku-Backend), keeping browser experience, authentication, upstream integrations, and backend services clearly separated.

---

## Run it locally

Clone your fork, install the dependencies, and launch the Vite development server.

```bash
git clone https://github.com/Aniraku/Aniraku.git
cd Aniraku
npm install
npm run dev
```

Before opening a pull request, run the checks that match your change.

```bash
npm run lint
npm run build
npm run test:bots
npm run test:e2e
```

| Command | Purpose |
|:--|:--|
| `npm run dev` | Start the local development server. |
| `npm run build` | Produce a production build. |
| `npm run preview` | Preview the production bundle locally. |
| `npm run lint` | Check the codebase with ESLint. |
| `npm run test:bots` | Run the player and route smoke checks. |
| `npm run test:e2e` | Run the Playwright end-to-end suite. |

---

## Bring good energy

Contributions are welcome when they make the experience faster, clearer, more accessible, or more reliable. Before touching player, authentication, sync, or upstream integrations, read the project’s [contribution guide](CONTRIBUTING.md) and keep secrets out of the repository.

If you are opening an issue, include the route, the device/browser, a concise reproduction path, and any useful console or network details. For visual changes, screenshots that show both desktop and mobile states make review much faster.

---

<p align="center">
  <strong>Find it. Watch it. Keep your place.</strong><br />
  <sub>Open source anime discovery and viewing, built with care by the Aniraku community.</sub>
</p>
