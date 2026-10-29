import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  FaClosedCaptioning,
  FaDownload,
  FaMicrophone,
  FaTimes,
} from 'react-icons/fa';
import { startEpisodeDownload } from '../../../lib/episodeDownload';
import { probeHlsVariants } from '../../../lib/hlsDownload';
import { ANIRAKU_API_BASE } from '../../../hooks/useApi';

// DownloadDialog — compact chooser before the download starts.
//
// Sub/Dub + quality (the active server's own per-quality sources; the
// backend ships each quality as its own URL). Confirming closes the dialog
// immediately and hands off to the floating DownloadStack pill — the file
// is committed to Chrome's download stack when assembly finishes.

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: var(--z-index-modal, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
`;

const Panel = styled.div`
  width: min(24rem, 100%);
  background-color: var(--global-secondary-bg);
  color: var(--global-text);
  border: 1px solid var(--global-border-color);
  border-radius: calc(var(--global-border-radius) + 2px);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  font-weight: 700;
  background-color: var(--global-div-tr);
  border-bottom: 1px solid var(--global-border-color);

  svg {
    color: var(--primary-accent);
  }
  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  color: var(--global-text);
  background: none;
  border: none;
  border-radius: var(--global-border-radius);
  cursor: pointer;
  &:hover {
    background-color: var(--global-button-hover-bg);
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
`;

const GroupLabel = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--global-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const Chip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  padding: 0.45rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $active }) =>
    $active ? 'var(--primary-accent)' : 'var(--global-text)'};
  background-color: ${({ $active }) =>
    $active ? 'var(--primary-accent-tr)' : 'var(--global-primary-bg)'};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'var(--primary-accent)' : 'var(--global-border-color)'};
  border-radius: 999px;
  cursor: pointer;
  &:hover {
    border-color: var(--primary-accent);
  }
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--global-text-muted);
`;

const Footer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
`;

const StartButton = styled.button`
  display: inline-flex;
  flex: 1;
  gap: 0.45rem;
  align-items: center;
  justify-content: center;
  padding: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--global-btn-text, #fff);
  background-color: var(--primary-accent);
  border: 1px solid var(--primary-accent);
  border-radius: var(--global-border-radius);
  cursor: pointer;
  &:hover {
    filter: brightness(1.08);
  }
`;

export interface DownloadDialogProps {
  isVisible: boolean;
  onClose: () => void;
  anilistId?: string | number | null;
  episodeNumber?: number;
  titleSlug: string;
  seriesTitle?: string;
  /** Language the user is currently watching (initial radio state). */
  currentLang: 'sub' | 'dub';
  /** Watched-server URL per language (null when the pool is empty). */
  preferredSource: Record<'sub' | 'dub', string | null>;
  /** CDN headers of the watched server, per language. */
  headers: Record<'sub' | 'dub', Record<string, string> | null>;
  /** Subtitle files of the watched server, per language. */
  subtitles: Record<
    'sub' | 'dub',
    { label: string; language?: string; url: string }[]
  >;
  /** Per-quality sources of the watched server, per language. */
  qualitySources: Record<'sub' | 'dub', { url: string; label: string }[]>;
}

const DownloadDialog: React.FC<DownloadDialogProps> = ({
  isVisible,
  onClose,
  anilistId,
  episodeNumber,
  titleSlug,
  seriesTitle,
  currentLang,
  preferredSource,
  headers,
  subtitles,
  qualitySources,
}) => {
  const [lang, setLang] = useState<'sub' | 'dub'>(currentLang);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [variants, setVariants] = useState<{ height: number; bandwidth: number }[]>([]);

  useEffect(() => {
    if (isVisible) {
      setLang(currentLang);
      setSelectedUrl(null);
      setSelectedHeight(null);
    }
  }, [isVisible, currentLang]);

  // The HLS master carries the real quality ladder (the API's sources are all
  // "auto"), so probe it for the chips instead of relying on server rows.
  const sourceUrl = preferredSource[lang];
  const qualityCount = qualitySources[lang].length;
  useEffect(() => {
    setVariants([]);
    setSelectedUrl(null);
    setSelectedHeight(null);
    if (!isVisible || !sourceUrl || qualityCount > 0) return;
    let alive = true;
    void probeHlsVariants(sourceUrl).then((items) => {
      if (alive) setVariants(items);
    });
    return () => {
      alive = false;
    };
  }, [isVisible, lang, sourceUrl, qualityCount]);

  if (!isVisible) return null;

  const ep = Math.max(1, Math.floor(Number(episodeNumber) || 1));

  return (
    <Backdrop
      onClick={onClose}
      role='presentation'
    >
      <Panel
        role='dialog'
        aria-modal='true'
        aria-label='Download episode'
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <FaDownload aria-hidden='true' />
          <span>Download Episode {ep}</span>
          <CloseButton onClick={onClose} aria-label='Close'>
            <FaTimes />
          </CloseButton>
        </Header>
        <Body>
          <div>
            <GroupLabel>Audio</GroupLabel>
            <ChipRow>
              <Chip
                $active={lang === 'sub'}
                onClick={() => setLang('sub')}
                aria-pressed={lang === 'sub'}
              >
                <FaClosedCaptioning aria-hidden='true' /> Sub
              </Chip>
              <Chip
                $active={lang === 'dub'}
                onClick={() => setLang('dub')}
                aria-pressed={lang === 'dub'}
              >
                <FaMicrophone aria-hidden='true' /> Dub
              </Chip>
            </ChipRow>
          </div>
          <div>
            <GroupLabel>Quality</GroupLabel>
            <ChipRow>
              {!!preferredSource[lang] && (
                <Chip
                  $active={!selectedUrl && !selectedHeight}
                  onClick={() => {
                    setSelectedUrl(null);
                    setSelectedHeight(null);
                  }}
                  title="The server you're watching right now"
                  aria-pressed={!selectedUrl && !selectedHeight}
                >
                  Current
                </Chip>
              )}
              {qualitySources[lang].map((option) => (
                <Chip
                  key={option.url}
                  $active={selectedUrl === option.url}
                  onClick={() => {
                    setSelectedUrl(option.url);
                    setSelectedHeight(null);
                  }}
                  aria-pressed={selectedUrl === option.url}
                >
                  {option.label}
                </Chip>
              ))}
              {variants.map((variant) => (
                <Chip
                  key={variant.height}
                  $active={selectedHeight === variant.height}
                  onClick={() => {
                    setSelectedHeight(variant.height);
                    setSelectedUrl(null);
                  }}
                  aria-pressed={selectedHeight === variant.height}
                >
                  {variant.height}P
                </Chip>
              ))}
            </ChipRow>
          </div>
          <InfoText>
            Saves{' '}
            <strong>
              {`aniraku-${titleSlug || 'anime'}-episode-${ep}${
                lang === 'dub' ? '-dub' : ''
              }.mkv`}
            </strong>{' '}
            — external subtitles are muxed in; the finished file appears in
            Chrome downloads.
          </InfoText>
        </Body>
        <Footer>
          <StartButton
            onClick={() => {
              if (!anilistId) return;
              startEpisodeDownload({
                anilistId,
                episode: ep,
                lang,
                titleSlug: titleSlug || 'anime',
                label: `EP ${ep}${
                  seriesTitle ? ` · ${seriesTitle}` : ''
                }${lang === 'dub' ? ' (dub)' : ''}`,
                preferredSourceUrl:
                  selectedUrl ?? preferredSource[lang] ?? null,
                headers: headers[lang],
                subtitles: subtitles[lang],
                qualityHeight: selectedHeight,
                apiBase: ANIRAKU_API_BASE,
              });
              onClose();
            }}
          >
            <FaDownload aria-hidden='true' /> Download
          </StartButton>
        </Footer>
      </Panel>
    </Backdrop>
  );
};

export default DownloadDialog;
