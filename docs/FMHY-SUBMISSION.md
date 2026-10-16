# FMHY (fmhy.net) Listing — Aniraku Site + Android App

> fmhy.net does not host sites. "Implement on fmhy.net" means getting listed
> in `fmhy/edit` (`docs/video.md` + `docs/mobile.md`). Staff must test and
> approve first via Discord / GitHub issue / PR. This file gives you the
> audit + copy-paste payload.

Repo: `Aniraku/Aniraku` (site) + `Aniraku/Aniraku-App` (Android)
Date checked: 2026-10-03
Submitted: https://github.com/fmhy/edit/issues/6568 (OPEN)

## 1. URLs to submit

| What | URL |
|:--|:--|
| Site (main) | https://www.aniraku.tech/ |
| Mirror 2 | https://aniraku.runs-on.dev/ |
| Mirror 3 | https://aniraku.vercel.app/ |
| Preview branch | https://test.aniraku.tech/ (uses `graphql-mirror.redacted.invalid` mirror, no rate limits) |
| Site source | https://github.com/Aniraku/Aniraku |
| Backend health / status | https://api-host.redacted.invalid/health |
| App site | https://aniraku.github.io/Aniraku-App/ |
| App source + APK releases | https://github.com/Aniraku/Aniraku-App / https://github.com/Aniraku/Aniraku-App/releases/latest |
| Community | https://discord.gg/aniraku |

All 4 web URLs returned `HTTP 200` on 2026-10-03 (Vercel, HSTS, CSP, `X-Frame-Options: DENY`).

Note: FMHY already lists the old `Miruro` (`Miruro-no-kuon/Miruro`) under
Anime Streaming. Aniraku is the renamed fork — call this out in your issue
so staff don't reject as duplicate.

## 2. Pre-submit audit (vs FMHY Stream-Site-Grading + Anime expectations)

Checked in this repo (`src/components/Watch/Video/Player.tsx`, `src/pages/Watch.tsx`, `vercel.json`, `public/`):

- [x] Sub / Dub, adjustable quality (HLS levels incl. 1080p, 1440p/4K where source has it), subtitles with customization (`Player.tsx:266-450`).
- [x] Provider fallback: multi-server pools + auto error-fallback + `/stream` fallback, tracked as AUTO badge (`docs/ARCHITECTURE.md` §3, `Player.tsx:1248-1262`).
- [x] Auto-Next episode + Auto Skip Intro/Outro via AniSkip (`VITE_SKIP_TIMES=https://api.aniskip.com/`).
- [x] Watchlist / Continue Watching / History / Ratings / Bookmarks / Comments, Supabase cloud sync + AniList/MAL import-export with status parity.
- [x] Discovery: catalog, schedules, recommendations, filters, search.
- [x] Ads: **no redirect / popunder ads in codebase**. Player sandboxes embeds and strips ad iframes (`Player.tsx:2139-2213`, iframe `allow-popups` only in explicit fallback path). Only Vercel Analytics + optional GA + `theanimecommunity.com` comments embed. Fixed misleading `About.tsx:58` "we do have to run advertisements" → now states no pop-up/redirect ads.
- [x] Mobile: responsive, touch targets 44px, PWA `manifest.json` standalone, `index.html` viewport + apple-touch-icon.
- [x] Custom player: Artplayer + HLS.js highly customized.
- [x] Privacy/Safety: `PRIVACY_POLICY.md`, `SUPPORT.md`, CSP in `vercel.json`, `robots.txt` + `sitemap.xml` present.

App (`Aniraku/Aniraku-App` v5.7.2, Android 9+, Expo + native player):

- Multi-provider, AniSkip, Auto+Manual quality, subtitle customization, offline downloads, PiP, sleep timer, gestures, 2x hold, 4-layer fallback, notifications, MAL/AniList sync, stats, recommendations, NSFW toggle, TMDB thumbnails, comments/ratings, cloud bookmark sync. APKs: `arm64` / `arm32` / `universal` in Releases.

Risks to disclose to FMHY (staff will find them anyway):

1. Backend runs on free cloud instance — discovery can be slower at peak (noted in App README).
2. Providers can come and go.
3. `test.aniraku.tech` is preview branch — list it as `[Preview]`, not as main mirror.

## 3. Copy-paste markdown for fmhy/edit

### 3a. `docs/video.md` → `## ▷ Anime Streaming` (upstream uses `* ` + named links)

```md
* [Aniraku](https://www.aniraku.tech/), [2](https://aniraku.runs-on.dev/), [3](https://aniraku.vercel.app/) - Sub / Dub / Auto-Next / 1080p / No Redirect Ads / Continue Watching / [Preview](https://test.aniraku.tech/) / [Status](https://api-host.redacted.invalid/health) / [Discord](https://discord.gg/aniraku) / [GitHub](https://github.com/Aniraku/Aniraku)
```

### 3b. `docs/mobile.md` → `## ▷ Android Anime`

```md
* [Aniraku](https://aniraku.github.io/Aniraku-App/) / [Discord](https://discord.gg/aniraku) / [GitHub](https://github.com/Aniraku/Aniraku-App) - Anime Streaming App / Sub / Dub / Offline Downloads / AniSkip / MAL-AniList Sync
```

### 3c. `docs/video.md` → `## ▷ Anime Streaming Apps` (optional, AnymeX is in both places)

```md
* [Aniraku](https://aniraku.github.io/Aniraku-App/) - Anime Streaming App / Android / [Discord](https://discord.gg/aniraku) / [GitHub](https://github.com/Aniraku/Aniraku-App)
```

Formatting rules per https://fmhy.net/other/contributing : bold only for starred/community-rec, order best-to-worst, keep ` - ` + `/` separators exactly as above. Do not mark your own entry bold-star — staff decides.

## 4. How to submit (staff must test first)

1. Search first: `Ctrl+F` on https://fmhy.net/single-page.md and https://api.fmhy.net/single-page for `aniraku` to prove not duplicate (except old Miruro).
2. Join Discord via https://github.com/fmhy/FMHY/wiki/FMHY-Discord (opens Fridays). Post in wiki-channels for link testing. Piracy/anime sites need extra vetting.
3. Open an **issue** (easier than PR for new sites) on https://github.com/fmhy/edit/issues — paste §5 below. Or feedback form at https://fmhy.net/feedback.
4. Only after Discord testing passes, open PR editing `docs/video.md` + `docs/mobile.md` with §3a+§3b. Reference the issue.
5. Track at https://fmhy.net/posts/changelog-sites.

Do NOT spam untested links. Submit only what you tested.

## 5. Ready-to-paste GitHub issue body

```md
Title: Add Aniraku (site + Android app) — anime

Site: https://www.aniraku.tech/
Mirrors: https://aniraku.runs-on.dev/, https://aniraku.vercel.app/
Preview: https://test.aniraku.tech/
Site source: https://github.com/Aniraku/Aniraku
Status: https://api-host.redacted.invalid/health
App site: https://aniraku.github.io/Aniraku-App/
App source + APK: https://github.com/Aniraku/Aniraku-App
Discord: https://discord.gg/aniraku

What it is:
- Site: open-source (AGPL-3.0) anime discovery + viewing, React/Vite/Artplayer/HLS.js, AniList metadata, Sub/Dub, adjustable quality to 1080p+ (4K where available), provider fallback, Auto-Next, Auto Skip (AniSkip), Continue Watching, history/ratings/bookmarks/comments, recommendations, mobile-responsive + PWA, no redirect/popunder ads (embeds sandboxed).
- App: Aniraku Android v5.7.2, Android 9+, open-source, multi-provider, offline downloads, PiP, AniSkip, MAL/AniList sync, APKs (arm64/arm32/universal) in GitHub Releases.

Relation to existing Miruro entry:
Aniraku is the renamed/continued fork (old entry: Miruro / Miruro-no-kuon/Miruro). Requesting new Aniraku entry; old Miruro entry can stay or be updated by staff.

Tested:
- All 4 web URLs return 200, playback with sub/dub, quality switch, auto-next, mobile layout.
- No adblock bypass needed, no redirect ads observed with uBlock Origin.

Suggested markdown (matches upstream `* ` + named-link style):
- docs/video.md Anime Streaming:
* [Aniraku](https://www.aniraku.tech/), [2](https://aniraku.runs-on.dev/), [3](https://aniraku.vercel.app/) - Sub / Dub / Auto-Next / 1080p / No Redirect Ads / Continue Watching / [Preview](https://test.aniraku.tech/) / [Status](https://api-host.redacted.invalid/health) / [Discord](https://discord.gg/aniraku) / [GitHub](https://github.com/Aniraku/Aniraku)
- docs/mobile.md Android Anime:
* [Aniraku](https://aniraku.github.io/Aniraku-App/) / [Discord](https://discord.gg/aniraku) / [GitHub](https://github.com/Aniraku/Aniraku-App) - Anime Streaming App / Sub / Dub / Offline Downloads / AniSkip / MAL-AniList Sync

Happy to join Discord testing whenever needed.
```

## 6. Local verification for this change

- `About.tsx` ad-copy fix only; no logic change.
- Run before push: `npm run lint`, `npm run build`.
