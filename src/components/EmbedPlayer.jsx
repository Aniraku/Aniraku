import { useState } from 'react'

// Player 2: iframe embed player used when a provider only works as an embed
// (episode-page players like kwik/kaa.lt) or when the main player has been
// exhausted. Cross-origin iframes can't be probed reliably, so the player
// surfaces manual escapes: back to the main player, open in a new tab.
export default function EmbedPlayer({ url, title, onBack }) {
  const [hint, setHint] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '80vh', background: '#000' }}>
      <iframe
        src={url}
        title={title || 'Embedded player'}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        onLoad={() => {
          // Cross-origin players may still fail to render (X-Frame-Options) —
          // show the escape hatch once the frame claims it loaded.
          setHint(true)
        }}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
      {(hint || onBack) && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            pointerEvents: 'none', fontSize: 11, color: 'rgba(226,232,240,0.7)',
            background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '4px 8px',
            backdropFilter: 'blur(4px)', textShadow: '0 1px 2px #000',
          }}>
            Embedded player — if it stays blank, the site may block embedding.
          </span>
          <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: 'rgba(15,23,42,0.85)', color: '#e2e8f0',
                  border: '1px solid rgba(226,232,240,0.25)', borderRadius: 8,
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Back to Player
              </button>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(99,102,241,0.9)', color: '#fff',
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                textDecoration: 'none', backdropFilter: 'blur(4px)',
              }}
            >
              Open in New Tab
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
