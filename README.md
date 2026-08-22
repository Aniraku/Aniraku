<div align="center">

<img src="./public/icons/icon-512.png" width="96" alt="Aniraku icon" />

# Aniraku

Open-source anime discovery and viewing for people who want to find something, watch it, and come back without losing their place.

<a href="https://www.aniraku.tech/">Open the web app</a>
&nbsp; · &nbsp;
<a href="https://github.com/Aniraku/Aniraku-Backend">Backend</a>
&nbsp; · &nbsp;
<a href="https://github.com/Aniraku/Aniraku-App">Android app</a>
&nbsp; · &nbsp;
<a href="CONTRIBUTING.md">Contribute</a>

</div>

---

## Support Aniraku

Aniraku is open source. Voluntary support helps fund **hosting, releases, and open-source development** and never changes access to site features.

<a href="https://patreon.com/ShoIslam">Support on Patreon</a>

| Optional crypto support | Value |
|:--|:--|
| Asset | USDT |
| Network | **BNB Smart Chain (BEP20) only** |
| Address | `0x0dc085fc880f2f67b4e200f125bc0de352da904e` |

> **Send USDT on BNB Smart Chain (BEP20) only.** Do not use Ethereum, Polygon, Arbitrum, or another network. Verify both the asset and network before sending because crypto transfers cannot be reversed.

<img src="./docs/assets/usdt-bep20-support-qr.png" width="180" alt="USDT on BNB Smart Chain BEP20 support QR code" />

Read the full [Support Guide](./SUPPORT.md).

## What Aniraku is

Aniraku keeps discovery, playback, watch history, ratings, bookmarks, comments, and recommendations close to the title you are watching. The goal is simple: spend less time moving between pages and more time watching.

The main flow is:

`discover` → `watch` → `remember`

The catalog uses AniList metadata, schedules, recommendations, and search. The player supports adaptive playback, provider fallback, subtitles, dubs, quality selection, seeking, and intro/outro skipping where the data is available. Progress and personal context remain attached to the title instead of disappearing after playback.

## Open the project

<a href="https://www.aniraku.tech/"><img src="https://img.shields.io/badge/OPEN%20ANIRAKU-Visit%20the%20live%20site-3B82F6?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open Aniraku live site" /></a>
<a href="https://github.com/Aniraku/Aniraku-App"><img src="https://img.shields.io/badge/ANDROID-App%20repository-111827?style=for-the-badge&logo=android&logoColor=3DDC84" alt="Open Aniraku Android repository" /></a>

## Main areas

| Area | What it covers |
|:--|:--|
| Discovery | Catalog browsing, schedules, recommendations, filters, and search. |
| Playback | Adaptive quality, provider fallback, subtitles, dubs, and player controls. |
| Personal context | Watch history, ratings, bookmarks, comments, and Continue Watching. |
| Title pages | Watched state, next episode, ratings, metadata, and a Rewatch path. |
| Responsive UI | Desktop, tablet, iOS, Android, and touch-friendly layouts. |

## Built with

`React` · `Vite` · `TanStack Query` · `styled-components` · `Artplayer` · `HLS.js` · `AniList` · `Supabase`

The frontend lives in `src/`. The playback, provider coordination, and synchronization boundary is maintained separately in [Aniraku-Backend](https://github.com/Aniraku/Aniraku-Backend).

## Run locally

```bash
git clone https://github.com/Aniraku/Aniraku.git
cd Aniraku
npm install
npm run dev
```

Before opening a pull request, run the checks that match your change:

```bash
npm run lint
npm run build
npm run test:bots
npm run test:e2e
```

| Command | Purpose |
|:--|:--|
| `npm run dev` | Start the local Vite development server. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | Run ESLint checks. |
| `npm run test:bots` | Run player and route smoke checks. |
| `npm run test:e2e` | Run Playwright end-to-end checks. |

## Contributing

Contributions are welcome when they make the experience faster, clearer, more accessible, or more reliable. Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing player, authentication, sync, or upstream integrations.

For issues, include the route, device/browser, a short reproduction path, and any useful console or network details. For visual changes, screenshots of both desktop and mobile states make review much easier.

<div align="center"><sub>Find it. Watch it. Keep your place.</sub></div>
