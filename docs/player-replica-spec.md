# Watch player replica spec — measured from flixcloud embed

Reverse-engineered from `https://flixcloud.cc/e/j99g1yqh9jpi?v=1` (ArtPlayer 5.x custom
build + hls.js + chapter/vtt-thumbnail/libass plugins). Sources: SSR payload, hydrated
route bundle (`nodes/12`), player core stylesheet, embed stylesheet, live DOM measurement
(1280×720) and screenshots. This spec drives the Aniraku watch player re-skin; Aniraku
keeps its own feature set (prev/next episode, 15s seeks, quality, subtitle styling,
Chromecast) inside the target's visual system.

## 1. Tokens (measured live)

| Role | Value | Where |
| --- | --- | --- |
| Player accent (theme/primary) | `#23ade5` | played bar, volume/seek fills, current rows, indicator |
| Secondary / skip-chapter highlight | `#fbff00` | intro & outro chapter bands, retry hover |
| Chapter base | `#555` | non-highlight chapter bands |
| Progress track | `rgba(255,255,255,.32)` | seek bar background |
| Progress loaded | `rgba(255,255,255,.5)` | buffered fill (we keep our own dim multi-range cue) |
| Progress hover fill | `rgba(255,255,255,.45)` | hover-scrub fill |
| Control pill | `rgba(20,20,20,.78)` | left/right control groups |
| Control hover | `rgba(255,255,255,.15)` | pill buttons |
| Control active | `rgba(255,255,255,.22)` | pill buttons pressed |
| Widget background | `rgba(28,28,28,.96)` + `blur(20px)` (backdrop:true → `rgba(0,0,0,.75)` + `saturate(180%) blur(20px)`) | settings, selector, notice, info |
| Widget border | `1px solid rgba(255,255,255,.06)` | settings, selector |
| Widget shadow | `0 8px 28px rgba(0,0,0,.5)` | settings, selector |
| Setting row hover | `rgba(255,255,255,.08)` | settings rows |
| Setting current | text `--art-theme` + `rgba(255,255,255,.05)` bg + 3px theme bar at left | settings/selector current row |
| Bottom gradient | `linear-gradient(transparent, rgba(0,0,0,.55))` over `140px` | bottom chrome fade |
| Mobile gradient | `linear-gradient(rgba(0,0,0,.35), transparent 20% 60%, rgba(0,0,0,.55))` full-size | ≤768px |
| Tooltip bg | `rgba(28,28,28,.95)` | progress tip, tooltips |
| Shortcut chip | `rgba(255,255,255,.1)` bg, `rgba(255,255,255,.2)` border, radius 4px, 18×18, 11px/600 uppercase | tooltip kbd hints |
| Font | Inter, sans-serif (player chrome); subtitles: bold outline style | chrome |

Geometry (desktop / fullscreen / ≤768px):

| Var | Desktop | Fullscreen | Mobile |
| --- | --- | --- | --- |
| `--art-control-height` | 40px | 48px | 28px |
| `--art-control-icon-size` | 24px | 28px | 16px |
| `--art-padding` | 12px | 18px | 10px |
| `--art-bottom-gap` | 14px | 18px | 4px |
| `--art-progress-height` | 4px (7px hover) | 4px | 4px (no grow) |
| `--art-indicator-size` | 16px | 16px | 10px (always visible) |

## 2. Component specs

**Control pills** — left group (play/pause, volume, time), right group (seek, tools).
`background rgba(20,20,20,.78); border-radius 999px; padding 0 4px; height var(--art-control-height);
box-shadow 0 1px 3px rgba(0,0,0,.25)`. Buttons inside: square hit-areas = control-height,
`border-radius 999px`, `transition background-color .15s ease, transform .12s ease`,
hover `rgba(255,255,255,.15)`, active `rgba(255,255,255,.22)`, icon `:active` scale(.9).
Time: `0 12px` padding, 13px/500, tabular-nums. Play/pause icon 20px.

**Volume** — collapsed to control-height; on hover the control expands to 136px and the
panel slides open (`width .25s cubic-bezier(.4,0,.2,1)`), horizontal 76px slider, 3px
track `rgba(255,255,255,.25)`, theme thumb 14px w/ shadow. Touch devices never expand.

**Seek bar** — full-width inside `--art-padding`, 4px track radius 3px, hover grows to 7px,
played = theme, indicator = theme 16px circle scale(0)→scale(1) on bar hover (scale 1.3 on
thumb hover), shadow `0 1px 4px rgba(0,0,0,.5)`. Hit padding 9px vertical. Mini-bar state
(controls hidden): whole bottom chrome fades out (`opacity 0, visibility hidden`) — clean video.

**Chapters** — plugin bands with 2px gaps, radius 3px; base `#555`; intro/outro
(`data-highlight`) `#fbff00`; played fill rides on top in theme color; chapter titles hidden
(thumbnail preview instead: 160×90 VTT sprites above the bar).

**Settings panel** — `rgba(28,28,28,.96)` (backdrop → `rgba(0,0,0,.75)` + blur(20px)
saturate(180%)), radius 14px, border `rgba(255,255,255,.06)`, `min-width 280px / max 320px`,
`padding 8px 0`, anchored above the right pill + 18px, `max-height min(420px, 100% - 130px)`.
Rows: 48px min-height, `12px 16px` padding, 14px text, 12px gap, 22px stroke icons,
value column `rgba(255,255,255,.75)` 13px. Current row: theme text + 3px×18px theme bar
(`::before` at left 6px) + `rgba(255,255,255,.05)` bg. Back row: 52px, hairline bottom border.
Range rows: 120px×4px track, 14px theme thumb. Thin 6px scrollbars (`rgba(255,255,255,.18)`).

**Selector lists (quality)** — same surface, radius 12px, `min-width 200px`, items
`11px 20px` padding, 13.5px text, 42px min-height, current = theme + 3px bar.

**Center play state** — `.art-state`: 80px circle, `rgba(0,0,0,.55)`, blur(10px), shadow
`0 2px 12px rgba(0,0,0,.4)`, 28px white icon, hover bg `rgba(0,0,0,.7)`.

**Notice** — inner chip `rgba(28,28,28,.95)`, radius 8px, `10px 14px` padding, 13px, blur(8px).

**Tooltips** — with `.art-shortcut` kbd chips: `Play [Space]`, `Pause [Space]`,
`Volume [↑ / ↓]`, `Rewind Ns [←]`, `Forward Ns [→]`, `Close [Esc]`, gear = "Settings",
PIP = "Miniplayer".

**Skip intro/outro buttons** — `rgba(0,0,0,.7)` bg, `1px solid rgba(255,255,255,.8)`,
radius 6px, `.6rem 1.2rem` padding, .9rem/500 white, blur(4px), shadow `0 2px 8px rgba(0,0,0,.3)`,
hover `rgba(0,0,0,.85)` + scale(1.02); countdown fill layer inside. Position: 20px from
sides, bottom 90px desktop; 12px/78px ≤768; 8px/70px ≤480.

**Fullscreen states** — control-height 48px, icon 28px, padding 18px, bottom-gap 18px,
time 14px.

**Mobile ≤768px** — pills dissolve: controls become absolutely-placed round buttons on the
video (play/pause left 2px, volume left 32px, time left 64px at 10px w/ text-shadow,
fullscreen right 2px, forward right 32px, backward right 62px; 20px icons; 16px play icon);
settings/quality/subtitle/cast/download become 30px circles (`rgba(0,0,0,.45)` + blur 4px)
at top:10px stepping right:10px/48px/86px; a 64px center play/pause circle
(`rgba(0,0,0,.45)` + blur 4px, hidden while loading); seek bar absolute at bottom 28px with
always-visible indicator; settings panel drops from top (top 41px, 240px wide, 32px rows,
11px text); volume panel hidden.

**Touch (hover:none / pointer:coarse)** — no hover backgrounds on controls/rows (active
state only), volume never expands, seek bar never grows, center state never brightens.

**Lock / mini-progress states** — pill backgrounds drop to transparent (only chrome fades).

## 3. Behavior config parity

- `miniProgressBar: true`, `backdrop: true`, `mutex: true`, `playsInline: true`
- `fastForward: true` + `Artplayer.FAST_FORWARD_VALUE = 2` (long-press 2× on touch)
- i18n tooltips with shortcut chips (above)
- theme pinned to the player accent token (`#23ade5`), secondary `#fbff00`
- icons: Material-Design glyphs for volume/fullscreen/web-fullscreen/pip/screenshot,
  lucide captions + languages, dual-arc loading spinner (all open-license paths, as the
  target uses)
- Aniraku keeps: prev/next episode controls, 15s seeks (tooltips say "Rewind 15s"), quality
  selector in settings, subtitle styling rows, Chromecast, hotkey:false + custom key handler

## 4. Deliberate deviations — Aniraku identity layer

The shared player grammar (pills, glass panels, seek bar) matches the reference; the identity
tweaks below make the player read as Aniraku's own, per the replica-brand rule (own accent
family, own mark):

- **Accent follows the app theme**: `--player-primary-color: var(--primary-accent)` — Aniraku
  violet `#b5a8ff`, resolved at runtime so the player re-tints with site themes. The reference
  pins flixcloud blue `#23ade5`; ours is a different color family on purpose.
- **Skip-chapter highlight is amber `#facc15`** (Aniraku's existing timeline-marker hue), not
  the reference's lemon `#fbff00`.
- **Aniraku brand mark** (logo + wordmark pill) sits top-left as an ArtPlayer layer and fades
  in/out with the control chrome via the `.art-control-show` class — no JS toggling.
- **Skip buttons tint violet on hover** (`border-color: var(--player-primary-color)`) instead
  of the reference's pure white.
- Seek step stays 15s (Aniraku behavior); no "+85s" button (Aniraku has skip overlays).
- Loaded/buffered rendering keeps Aniraku's multi-range dim cue (target shows a single loaded bar).
- Subtitle font stays the user-configurable Aniraku system; target's Gandhi Sans is a licensed
  font and is not copied.
- No FlixCloud branding/copy; "Copy video URL" context menu not ported (contextmenu hidden in
  target too).
