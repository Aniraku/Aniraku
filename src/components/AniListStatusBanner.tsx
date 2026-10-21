import { useEffect, useState } from 'react';

// AniList outage banner, driven by the `aniraku:anilist-status` window event
// dispatched by useApi.ts after each failed or successful AniList GraphQL
// fetch. Uses role/aria-live and the standard outage copy.
//
// Dismissal is session-level state; a success event re-arms the banner for
// the next outage. There is no "Try again" button: the banner clears on the
// next successful fetch.

// Mirrors useApi.ts's ANILIST_STATUS_EVENT (kept in sync by hand).
const ANILIST_STATUS_EVENT = 'aniraku:anilist-status';

type AniListStatusDetail = { unavailable?: boolean };

export function AniListStatusBanner() {
  const [unavailable, setUnavailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onStatus = (event: Event) => {
      const detail = (event as CustomEvent<AniListStatusDetail>).detail;
      const down = Boolean(detail?.unavailable);
      setUnavailable(down);
      // Recovery re-arms the banner so a later outage shows again.
      if (!down) setDismissed(false);
    };
    window.addEventListener(ANILIST_STATUS_EVENT, onStatus);
    return () => window.removeEventListener(ANILIST_STATUS_EVENT, onStatus);
  }, []);

  if (!unavailable || dismissed) return null;

  return (
    <div
      role='status'
      aria-live='polite'
      style={{
        position: 'relative',
        // No elevated z-index on purpose: the fixed navbar (z 600) must
        // keep painting over the banner as the page scrolls under it.
        background: '#251717',
        borderBottom: '1px solid rgba(248,113,113,0.48)',
        color: '#fee2e2',
        padding: '10px clamp(0.75rem, 2vw, 1.5rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <span>
        <strong>AniList is temporarily unavailable.</strong> Discovery, search,
        and some metadata will recover automatically when the upstream service
        responds.
      </span>
      <button
        type='button'
        onClick={() => setDismissed(true)}
        aria-label='Dismiss AniList outage notice'
        style={{
          minHeight: 32,
          padding: '0 11px',
          border: '1px solid rgba(254,226,226,0.55)',
          borderRadius: 6,
          background: 'transparent',
          color: '#fff',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

export default AniListStatusBanner;
