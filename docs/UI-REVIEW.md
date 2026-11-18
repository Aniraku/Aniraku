# UI Review — Aniraku frontend

Retroactive 6-pillar visual audit (gsd-ui-review). Evidence: headless-browser
screenshots of `/`, `/login`, `/signup`, `/auth/forgot-password` at 1280×720
and 390×844 (dev + production build), plus code review of the styling layers
(`themes.css`, `globals.css`, `interactions.css`, `animations.css`, key
components). Session date: 2026-11-18. Grading: 1 = broken, 2 = weak,
3 = solid, 4 = exemplary.

| Pillar | Grade | Summary |
| --- | --- | --- |
| 1. Visual hierarchy | 3.5 | Home hero + rails are unambiguous; auth screen rebuilt this session with split brand/form hierarchy. Weak spot: some side-panel headings rely on weight alone. |
| 2. Typography | 3.5 | Single family (Rubik), weights 400–700, tight tracking on headings; body 14–16px, line-height ~1.5. Weak spot: a few 11–13px labels sit below comfortable reading size. |
| 3. Color & contrast | 3.5 | Token-driven themes (dark/light/anilist/catppuccin), one accent, semantic status colors. Weak spot: muted text `#696969` on `#080808` is ~4.0:1 — passes for large text, shy for small. |
| 4. Spacing & layout | 3 | Consistent card radius/gaps; no horizontal overflow at any width (global `overflow-x: clip`). Weak spot: several hand-rolled one-off paddings across components. |
| 5. Interaction & motion | 4 | Global press/release + focus-ring layer (`interactions.css`), reduced-motion gating throughout, transform/opacity-only. This session: gated the last ungated hover transforms (HomeCarousel) and added a CSS-only auth entrance. |
| 6. Accessibility & semantics | 3.5 | Visible focus rings never removed, `aria-live` on async states, 44px+ tap targets on primary controls, 16px form controls on touch. Weak spot: poster cards convey metadata in small low-contrast chips. |

## Findings fixed this session

- Auth screens (login/signup/forgot): rebuilt with brand panel + focused form,
  password visibility toggle, inline validation hint, terms note, noindex;
  fixed a 120px vertical overflow caused by content-box `min-height: 100dvh`.
- Sticky hover on touch: `scale(1.05)` hovers gated behind
  `@media (hover: hover) and (pointer: fine)` (HomeCarousel hero CTA chips).
- Tap latency: global `touch-action: manipulation` on controls.
- iOS focus-zoom: `font-size: 16px` floor for native form controls on coarse
  pointers.
- Viewport-height jumps: `dvh` override on Profile panel and shortcuts dialog.
- `AuthConfirm`: off-brand red button + hardcoded hexes → theme tokens.
- Auth entrance motion: single 260ms rise/fade, 60ms stagger, reduced-motion
  gated, CSS-only (content never hidden without JS).

## Findings fixed this session — whole-site pass

Evidence: headless captures of /, /trending, /schedule, /search, /info (prod),
/watch, /about, /faq, /history, /profile, /settings, /license, 404; the
Settings modal additionally click-tested in a real browser.

- **Trending season/year rails + Schedule day strip**: giant clipped text with
  hidden scrollbars read as broken layout. Added a scroll-position-aware edge
  fade (`data-fade` = left/right/both/none from a ResizeObserver + scroll
  listener; `mask-image` + `-webkit-` fallback) so only the side holding
  unreachable content fades — a rail at its origin never fakes a fade.
- **About `<Keyword>`**: a leftover template artifact painted a `■` glyph over
  each keyword (read as strikethrough) and used a nonexistent
  `--your-custom-color` token. Removed the glyph; keywords now use
  `--primary-accent`.
- **Link colors off-token**: PolicyTerms hardcoded `#744aff` (plus a dead
  `customColor` map entry) and the FAQ intro link fell back to browser-blue —
  both now `--primary-accent`.
- **History empty state** was a dead end: added a "Browse anime" CTA below the
  artwork; the "What's all this?" toggle's floating `+` wrapped onto its own
  line — restyled as a flex row, `+` rotates to `×` when open (reduced-motion
  gated).
- **Muted text contrast**: dark `#696969` → `#8a8a8a` (3.5 → 5.7:1) and light
  `#888` → `#707070` (3.3 → 4.5:1) — both now pass WCAG AA for body text;
  AniList and Catppuccin themes already passed.
- **Announcement modal header**: 9.8px monospace tracked-caps kicker →
  sentence-case "Aniraku announcement" at 12.5px, app font.
- **`transition: all` sweep** (4 occurrences): EpisodeCard/MiniSchedule
  section links now transition `color, transform` only (hover slide moved
  from `padding-left` to `translateX` — no layout animation); the two round
  icon buttons (side menu close, settings) transition `border-color,
  background-color`.

## Verified non-issues

- **Settings modal bleed-through**: a headless capture of `/profile?settings=1`
  showed the page's "You are not logged in" text painting through the modal
  panel. Click-testing the modal in a real browser shows an opaque, correctly
  stacked panel (`--global-div-tr` is opaque in every theme) — the capture
  artifact was animation-related, not a product bug.
- Infinite loops kept on purpose: skeleton pulses, loading dots, spinners
  (status indicators), the dice roll (user-triggered feedback), and the
  notification empty-state bell sway (rare-surface delight, reduced-motion
  gated).

## Open items (next highest impact)

1. The Schedule page's single-entry time slots render one wide card on the
   left with the rest of the row empty — a data-driven asymmetry worth a
   cap/center treatment.
2. Search results blur-up images can linger at low resolution; confirm the
   full-res swap fires on slow networks.
3. Poster-card meta chips (episode counts, scores) are the smallest text in
   the app and the most-read; worth a dedicated contrast pass.
4. FAQ quick-nav chips could scroll-spy the open question on long pages.
