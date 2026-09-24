import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FaFlag } from 'react-icons/fa';

// ---------------------------------------------------------------------------
// Report modal — port of the live `Et` component (WatchRoute chunk, module
// 1tfyf). Issue options, labels, validation texts, submit payload and the
// 60s cooldown match live exactly. Submit differs from live on purpose: the
// backend `POST {api}/reports` route answers 404 (documented backend gap),
// so delivery is a mailto: redirect with a pre-filled template to the
// maintainer inbox — the visitor writes their message in their mail app and
// presses Send.
// ---------------------------------------------------------------------------

const W = {
  modalContent: `_modalContent_1tfyf_1`,
  title: `_title_1tfyf_17`,
  formContainer: `_formContainer_1tfyf_25`,
  section: `_section_1tfyf_26`,
  label: `_label_1tfyf_36`,
  providersGrid: `_providersGrid_1tfyf_42`,
  quickActionsGrid: `_quickActionsGrid_1tfyf_46`,
  checkboxLabel: `_checkboxLabel_1tfyf_50`,
  textArea: `_textArea_1tfyf_71`,
  buttonContainer: `_buttonContainer_1tfyf_93`,
  button: `_button_1tfyf_93`,
} as const;

// Verbatim from live style.css (module 1tfyf).
const LIVE_REPORT_CSS = `
._modalContent_1tfyf_1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-moz-box-orient:vertical;-moz-box-direction:normal;flex-direction:column;gap:.75rem;width:80%;max-width:35rem;max-height:90vh;padding:1rem;text-align:start;background-color:var(--global-div-tr);border:1px solid var(--global-border-color);border-radius:calc(var(--global-border-radius) + 2px);--animation-duration: .32s;--animation-easing: ease-out}
._title_1tfyf_17{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;gap:.5rem;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center;margin:0 0 .25rem;font-size:1.15rem;color:var(--global-text)}
._formContainer_1tfyf_25,._section_1tfyf_26{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-moz-box-orient:vertical;-moz-box-direction:normal;flex-direction:column}
._formContainer_1tfyf_25{gap:.75rem}
._section_1tfyf_26{gap:.375rem}
._label_1tfyf_36{margin:0;font-size:.9rem;font-weight:700;color:var(--global-text-muted)}
._providersGrid_1tfyf_42{display:grid;grid-template-columns:repeat(auto-fit,minmax(clamp(100px,25vw,120px),1fr))}
._quickActionsGrid_1tfyf_46{display:grid;grid-template-columns:repeat(auto-fit,minmax(clamp(150px,25vw,200px),1fr))}
._checkboxLabel_1tfyf_50{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;align-items:center;gap:.5rem;padding:.5rem;font-size:clamp(.75rem,.8vw + .6rem,.85rem);color:var(--global-text-muted);cursor:pointer;-webkit-user-select:none;-moz-user-select:none;user-select:none;border-radius:var(--global-border-radius)}
._checkboxLabel_1tfyf_50 input[type=checkbox],._checkboxLabel_1tfyf_50 input[type=radio]{width:clamp(.75rem,.8vw + .6rem,.85rem);height:clamp(.75rem,.8vw + .6rem,.85rem);accent-color:var(--global-text);cursor:pointer}
._checkboxLabel_1tfyf_50:hover{background-color:var(--global-secondary-bg)}
._textArea_1tfyf_71{min-height:5rem;padding:.6rem;font-size:.75rem;line-height:1.25rem;color:var(--global-text);resize:vertical;background-color:var(--global-secondary-bg);border:1px solid var(--global-border-color);border-radius:var(--global-border-radius);outline:none;box-shadow:none}
._textArea_1tfyf_71::placeholder{font-size:.75rem;line-height:1.25rem;color:var(--global-text-muted)}
._textArea_1tfyf_71:focus{border-color:var(--primary-accent);box-shadow:0 0 0 4px var(--primary-accent-tr)}
._buttonContainer_1tfyf_93{display:block;width:100%;margin-top:.5rem}
._button_1tfyf_93{display:block;width:100%;padding:.85rem 1rem;font-size:1rem;font-weight:700;color:var(--global-text);text-align:center;cursor:pointer;background-color:var(--global-div-tr);border:1px solid var(--global-border-color);border-radius:var(--global-border-radius)}
._button_1tfyf_93:not(:disabled):hover{background-color:var(--global-div)}
._button_1tfyf_93:disabled{color:var(--global-text-muted);cursor:not-allowed;transform:none}
`;

if (
  typeof document !== `undefined` &&
  !document.getElementById(`live-report-css`)
) {
  const style = document.createElement(`style`);
  style.id = `live-report-css`;
  style.textContent = LIVE_REPORT_CSS;
  document.head.appendChild(style);
}

// Live Tt — issue options.
const ISSUE_OPTIONS = [
  { type: `episodes-wrong`, label: `Missing servers or providers` },
  { type: `video-broken`, label: `Selected episode won't play` },
  { type: `download-missing`, label: `Missing download link` },
  { type: `metadata-wrong`, label: `Wrong show (title, synopsis, etc)` },
] as const;

const REPORT_COOLDOWN_MS = 60_000; // live Ot = 6e4

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: var(--z-index-max);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fadeIn 0.2s ease-in-out;
`;

const StatusLine = styled.p<{ $tone?: 'error' | 'success' | 'loading' }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ $tone }) =>
    $tone === 'error'
      ? '#e06c6c'
      : $tone === 'success'
        ? '#7aa37a'
        : 'var(--global-text-muted)'};
`;

export type ReportPayload = {
  refreshEpisodes?: boolean;
  refreshMetadata?: boolean;
  refreshProviders?: string[];
  details?: string;
  episode?: number;
  type?: string;
  anilistId?: string;
};

type ReportModalProps = {
  isVisible: boolean;
  onClose: () => void;
  episode?: number;
  /** Provider keys present for this episode (live `i` prop). */
  providers?: string[];
  /** Subset of `providers` that offer a download (live capability map). */
  downloadProviders?: string[];
  anilistId?: string | number | null;
};

// Maintainer inbox — every report opens the visitor's mail client with a
// pre-filled template addressed here (no backend hop, no API keys).
const REPORT_EMAIL = `sho.islam0311@proton.me`;

function openReportEmail(payload: ReportPayload): void {
  const requested = [
    payload.refreshEpisodes ? `refresh episodes` : null,
    payload.refreshMetadata ? `refresh metadata` : null,
  ]
    .filter((r): r is string => r !== null)
    .join(`, `);
  const lines = [
    `Issue: ${payload.type ?? `other`}`,
    `AniList ID: ${payload.anilistId ?? `-`}`,
    payload.episode !== undefined ? `Episode: ${payload.episode}` : null,
    payload.refreshProviders?.length
      ? `Providers: ${payload.refreshProviders.join(`, `)}`
      : null,
    requested ? `Requested: ${requested}` : null,
    `Page: ${window.location.href}`,
    ``,
    `Details:`,
    payload.details ?? ``,
    ``,
    `--- Add any extra notes above, then press Send. ---`,
  ].filter((l): l is string => l !== null);
  const subject = `[Aniraku Report] ${payload.type ?? `issue`}${
    payload.episode !== undefined ? ` · ep ${payload.episode}` : ``
  }`;
  window.location.href = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(lines.join(`\n`))}`;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isVisible,
  onClose,
  episode,
  providers = [],
  downloadProviders = [],
  anilistId,
}) => {
  const [type, setType] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [details, setDetails] = useState(``);
  const [status, setStatus] = useState<{
    tone: 'error' | 'success' | 'loading';
    text: string;
  } | null>(null);
  const [lastAttemptAt, setLastAttemptAt] = useState<number>(0);
  const [cooldown, setCooldown] = useState(0);

  // Live 60s report cooldown countdown.
  useEffect(() => {
    if (!lastAttemptAt) return;
    const tick = () => {
      const elapsed = Date.now() - lastAttemptAt;
      const remaining = REPORT_COOLDOWN_MS - elapsed;
      if (remaining > 0) {
        setCooldown(Math.ceil(remaining / 1000));
      } else {
        setCooldown(0);
      }
    };
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => window.clearInterval(iv);
  }, [lastAttemptAt]);

  const hasAnyProvider = providers.length > 0;
  const hasDownloadCapability = downloadProviders.length > 0;
  const needsSource =
    type === `video-broken` || type === `download-missing`;

  const filteredProviders = useMemo(() => {
    const visible = providers.map((key) => ({ key, displayName: key }));
    if (type === `download-missing`)
      return visible.filter((p) => downloadProviders.includes(p.key));
    return visible;
  }, [providers, downloadProviders, type]);

  // Live `x` — options hidden when the backend can't serve them.
  const visibleOptions = ISSUE_OPTIONS.filter((option) =>
    option.type === `video-broken`
      ? hasAnyProvider
      : option.type !== `download-missing` ||
        (hasAnyProvider && hasDownloadCapability),
  );

  const toggleType = (next: string) => {
    if (type === next) {
      setType(null);
      setSelectedProviders([]);
      return;
    }
    setType(next);
    if (next === `download-missing`) {
      const first = downloadProviders[0];
      setSelectedProviders(first ? [first] : []);
    } else {
      setSelectedProviders([]);
    }
    setStatus(null);
  };

  const toggleProvider = (key: string) => {
    setSelectedProviders((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = details.trim();
    if (cooldown > 0) {
      setStatus({
        tone: `error`,
        text: `Please wait ${cooldown}s before reporting again`,
      });
      return;
    }
    if (!type && !trimmed) {
      setStatus({
        tone: `error`,
        text: `Select at least one option or add details.`,
      });
      return;
    }
    if (needsSource && selectedProviders.length === 0) {
      setStatus({
        tone: `error`,
        text: `Please select at least one provider for the issue.`,
      });
      return;
    }
    if (!anilistId) {
      setStatus({ tone: `error`, text: `Missing AniList ID` });
      return;
    }

    const payload: ReportPayload = {
      refreshEpisodes: type === `episodes-wrong` ? true : undefined,
      refreshMetadata: type === `metadata-wrong` ? true : undefined,
      refreshProviders:
        selectedProviders.length > 0 ? selectedProviders : undefined,
      details: trimmed || undefined,
      episode,
      type: type ?? undefined,
      anilistId: String(anilistId),
    };

    setLastAttemptAt(Date.now());
    setStatus({ tone: `loading`, text: `Opening your email app...` });
    try {
      openReportEmail(payload);
      setStatus({
        tone: `success`,
        text: `Report template ready — review it and press Send.`,
      });
      setType(null);
      setSelectedProviders([]);
      setDetails(``);
    } catch {
      setStatus({
        tone: `error`,
        text: `Couldn't open your email app. Email ${REPORT_EMAIL} directly.`,
      });
    }
  };

  if (!isVisible) return null;

  return (
    <Backdrop
      onClick={() => {
        onClose();
        setStatus(null);
      }}
    >
      <div
        className={W.modalContent}
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
      >
        <h2 className={W.title}>
          <FaFlag aria-hidden='true' />{' '}
          {episode ? `Report - Episode ${episode}` : `Report`}
        </h2>
        <form className={W.formContainer} onSubmit={handleSubmit}>
          <div className={W.section}>
            <p className={W.label}>What&rsquo;s the issue?</p>
            <div className={W.quickActionsGrid}>
              {visibleOptions.map((option) => (
                <label key={option.type} className={W.checkboxLabel}>
                  <input
                    type='checkbox'
                    checked={type === option.type}
                    onChange={() => toggleType(option.type)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          {needsSource && filteredProviders.length > 0 && (
            <div className={W.section}>
              <p className={W.label}>Which source(s) are affected?</p>
              <div className={W.providersGrid}>
                {filteredProviders.map(({ key, displayName }) => (
                  <label key={key} className={W.checkboxLabel}>
                    <input
                      type='checkbox'
                      checked={selectedProviders.includes(key)}
                      onChange={() => toggleProvider(key)}
                    />
                    {displayName}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className={W.section}>
            <p className={W.label}>Notes</p>
            <textarea
              className={W.textArea}
              placeholder='Brief description - up to 500 characters'
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />
          </div>
          {status && (
            <StatusLine $tone={status.tone}>{status.text}</StatusLine>
          )}
          <div className={W.buttonContainer}>
            <button
              className={W.button}
              type='submit'
              disabled={(!type && !details.trim()) || cooldown > 0}
            >
              Send Report by Email
            </button>
          </div>
        </form>
      </div>
    </Backdrop>
  );
};

export default ReportModal;
