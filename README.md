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


> [!CAUTION]
>If it has saved you time, a small donation keeps it up. And the library keeps growing — **missing an anime?** Email [`sho.islam0311@proton.me`](mailto:sho.islam0311@proton.me) and it'll get added.

<p align="center">
  <a href="https://patreon.com/ShoIslam"><img src="https://img.shields.io/badge/Support_on_Patreon-FF4D4D?style=for-the-badge&logo=patreon&logoColor=white" alt="Support on Patreon" /></a>
</p>
<p align="center">
  <img src="./assets/images/binance-pay-qr.png" width="190" alt="Binance Pay QR code for UID 1098400042" /><br>
  <sub>Binance Pay UID <code>1098400042</code> · full details in <a href="./SUPPORT.md">SUPPORT.md</a></sub>
</p>

## What Aniraku is

Aniraku keeps discovery, playback, watch history, ratings, bookmarks, comments, and recommendations close to the title you are watching. The goal is simple: spend less time moving between pages and more time watching.

The main flow is:

`discover` → `watch` → `remember`

> [!IMPORTANT]
> Metadata comes from AniList. The two deploy branches use different
> endpoints with the same schema — keep each branch on its own:
>
> - **Preview** (`test.aniraku.tech`): a **publicly hosted Anilist offline database** with **no rate limits** — [Mirror](https://graphql.aniraku.tech) ([repo](https://github.com/Shoislam0311/anilist-offline-db)).
> - **Main** (`www.aniraku.tech`): the **official AniList public API** (`https://graphql.anilist.co`).
>
> Authenticated AniList traffic stays on the official API on both branches.
## Open the project

<a href="https://test.aniraku.tech/"><img src="https://img.shields.io/badge/OPEN%20ANIRAKU-Visit%20the%20live%20site-3B82F6?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open Aniraku live site" /></a>
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

`React` · `Vite` · `Apollo Client` · `styled-components` · `Artplayer` · `HLS.js` · `AniList` · `Supabase`

The frontend lives in `src/`. The playback, provider coordination, and synchronization boundary is maintained separately in [Aniraku-Backend](https://github.com/Aniraku/Aniraku-Backend).

## Run locally

```bash
git clone https://github.com/Aniraku/Aniraku.git
cd Aniraku
npm install
npm run dev
```

Browsing, searching, and watching work without any configuration. To enable auth, history, and bookmarks locally, copy `.env.example` to `.env.local` and fill in your Supabase keys.

## Checks

| Command | Purpose |
|:--|:--|
| `npm run dev` | Start the local dev server (`http://localhost:3000`). |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | Run ESLint checks. |
| `npm run format` | Format the codebase with Prettier. |
| `npm run sitemap` | Regenerate the XML sitemap from AniList. |

Before opening a pull request, `npm run lint` and `npm run build` must both pass.

## Contributing

Contributions are welcome when they make the experience faster, clearer, more accessible, or more reliable. Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing player, authentication, sync, or upstream integrations.

For issues, include the route, device/browser, a short reproduction path, and any useful console or network details. For visual changes, screenshots of both desktop and mobile states make review much easier.

<div align="center"><sub>Find it. Watch it. Keep your place.</sub></div>
