import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaComments } from 'react-icons/fa';
import { useTheme } from '../ThemeContext';
import TacLoginNotice from '../TacLoginNotice';
import type { Anime } from '../../hooks/animeInterface';

// ---------------------------------------------------------------------------
// The Anime Community comments embed — live `Ye` from Seasons-O6-NO94x.js.
//
// The Info page renders it as `<Ye media episodeNumber:0 forceInline:!0>`
// inside a `_infoCommentsSection_aojp4_108` wrapper (InfoRoute-BPEGjnwd.js),
// so only the INLINE variant is built here: `forceInline` forces the compact
// bottom-sheet (`L(Be)`, breakpoint 768) off. Strings, DOM order and every
// qywzu_* class are taken verbatim from the live chunk + style.css.
//
// Config keys / colorScheme probe / script loader mirror the live code:
//   window.theAnimeCommunityConfig = { AniList_ID, episodeChapterNumber,
//     mediaType, colorScheme, removeBorder, removePadding }
//   https://theanimecommunity.com/embed.js  (id: anime-community-script)
//   injected into <div id="anime-community-comment-section">.
// ---------------------------------------------------------------------------

const FRAME_ID = 'anime-community-comment-section';
const SCRIPT_ID = 'anime-community-script';
const EMBED_JS = 'https://theanimecommunity.com/embed.js';
// live `Ve` — resolved through a detached div so `color-mix` computes.
const PRIMARY_PROBE = 'color-mix(in srgb, var(--primary-accent) 65%, black)';

interface ColorScheme {
  primaryColor: string;
  backgroundColor: string;
  dropDownTextColor: string;
  strongTextColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  iconColor: string;
  accentColor: string;
}

// live `We` (empty defaults) + `Ge` (keys) + `Ke` (key-by-key equality).
const EMPTY_SCHEME: ColorScheme = {
  primaryColor: '',
  backgroundColor: '',
  dropDownTextColor: '',
  strongTextColor: '',
  primaryTextColor: '',
  secondaryTextColor: '',
  iconColor: '',
  accentColor: '',
};
const SCHEME_KEYS = Object.keys(EMPTY_SCHEME) as (keyof ColorScheme)[];
const schemeEqual = (a: ColorScheme, b: ColorScheme): boolean =>
  SCHEME_KEYS.every((k) => a[k] === b[k]);

type TacWindow = Window & {
  theAnimeCommunityConfig?: Record<string, unknown>;
  theAnimeCommunity?: { reload?: () => void };
};

// live `G(e,t)` — read a (custom) property from the root's computed style.
const cssVar = (prop: string): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(prop)
    .trim();

// live `qe(e)` — resolve a possibly-`color-mix` value to a concrete color.
const resolveColor = (color: string): string => {
  const probe = document.createElement('div');
  probe.style.color = color;
  probe.style.display = 'none';
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

// live `Je()` — build the colorScheme from the current theme's CSS variables.
const buildScheme = (): ColorScheme => {
  if (typeof document === 'undefined') return EMPTY_SCHEME;
  const text = cssVar('--global-text');
  return {
    primaryColor: resolveColor(PRIMARY_PROBE),
    backgroundColor: cssVar('--global-div'),
    strongTextColor: text,
    primaryTextColor: text,
    dropDownTextColor: text,
    secondaryTextColor: cssVar('--global-text-muted'),
    iconColor: cssVar('--global-text-muted-strong'),
    accentColor: cssVar('--global-border-color'),
  };
};

// live reads the comments flag straight from the settings record
// (`localStorage['miruro:settings'].settings.comments ?? true`) — the public
// `useSettings()` shape doesn't expose it, so read it the same way live does.
const readCommentsSetting = (): boolean => {
  try {
    const raw = localStorage.getItem('miruro:settings');
    if (!raw) return true;
    const value = JSON.parse(raw)?.settings?.comments;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'Enabled' || value === 'true';
    return true;
  } catch {
    return true;
  }
};

// live `Ue()` — module-level promise so remounts reuse the same <script>.
let scriptPromise: Promise<void> | null = null;
const ensureScript = (): Promise<void> => {
  const w = window as TacWindow;
  if (typeof document === 'undefined' || w.theAnimeCommunity?.reload)
    return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => {
          scriptPromise = null;
          reject(new Error('TAC script load failed'));
        },
        { once: true },
      );
      return;
    }
    const el = document.createElement('script');
    el.id = SCRIPT_ID;
    el.src = EMBED_JS;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      scriptPromise = null;
      reject(new Error('TAC script load failed'));
    };
    document.head.appendChild(el);
  });
  return scriptPromise;
};

// ---------------------------------------------------------------------------
// Styles — live class text (qywzu_* + aojp4_108) as styled-components.
// ---------------------------------------------------------------------------

// _commentButtonWrapper_qywzu_47
const ButtonWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: auto;
  overflow: hidden;
`;

// _commentButton_qywzu_1
const CommentButton = styled.button`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  color: var(--global-text);
  cursor: pointer;
  background-color: transparent;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);

  &[data-active='true'] {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr);
    border-color: var(--primary-accent);
  }
  &:hover {
    background-color: var(--global-div);
  }
  &[data-active='true']:hover {
    background-color: var(--primary-accent-tr);
  }
  &:active {
    transform: scale(0.95);
  }
  svg {
    font-size: 1rem;
  }
`;

// _titleContainer_qywzu_70
const TitleBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  background-color: var(--global-div-tr);
  justify-content: space-between;
  padding: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--global-text);
  cursor: pointer;
  user-select: none;

  &:hover:not(:has(${ButtonWrapper}:hover)) {
    background-color: var(--global-div);
  }
`;

// _titleWrapper_qywzu_87
const TitleWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

// _label_qywzu_92
const Label = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: var(--global-text);
`;

// _framePad_qywzu_97 (padding) + _hidden_qywzu_105 (display:none)
const FrameWrap = styled.div<{ $hidden: boolean }>`
  padding: 1.25rem;
  @media (max-width: 500px) {
    padding: 0 0.5rem 0.5rem;
  }
  ${({ $hidden }) => ($hidden ? 'display: none;' : '')}
`;

// _frame_qywzu_97
const Frame = styled.div`
  width: 100%;
  overflow: hidden;
  border-radius: var(--global-border-radius);
`;

// _commentSectionContainer_qywzu_61
const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--global-text);
  background-color: var(--global-div);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

// _infoCommentsSection_aojp4_108
const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
  margin-left: 2rem;
  @media (max-width: 950px) {
    margin-left: 0;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface InfoCommentsProps {
  media: Anime;
  loading?: boolean;
}

const InfoComments: React.FC<InfoCommentsProps> = ({ media, loading = false }) => {
  const { theme } = useTheme();
  // live `[f,p]` — initialized from the comments setting, toggled by the title.
  const [showFrame, setShowFrame] = useState<boolean>(() =>
    readCommentsSetting(),
  );
  // live `[g,_]` — colorScheme, recomputed on theme change (deps [themeName, compact]).
  const [scheme, setScheme] = useState<ColorScheme>(() => buildScheme());

  // live `Ee(media)` — AniList id as a positive-integer string. Live's id is a
  // number; the local Anime.id is a string, so normalize before the check.
  const numericId = Number(media?.id);
  const anilistId =
    media?.id != null && Number.isFinite(numericId) && numericId > 0
      ? String(numericId)
      : null;
  // live `De({overall:true, ...})` — Info has episodeNumber 0 → '0' overall.
  const chapter = '0';
  // live `E` — the ANIME tab is always active here (no episode context).
  const animeActive = true;
  // live `D` — frame visible once loaded + id valid + not toggled off.
  const visible = !loading && anilistId !== null && showFrame;

  // live recompute effect (rAF so the theme class has been applied first).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setScheme((prev) => {
        const next = buildScheme();
        return schemeEqual(prev, next) ? prev : next;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  // live config effect: publish config → load embed.js → reload().
  useEffect(() => {
    if (anilistId === null || chapter === null) return;
    const w = window as TacWindow;
    w.theAnimeCommunityConfig = {
      AniList_ID: anilistId,
      episodeChapterNumber: chapter,
      mediaType: 'anime',
      colorScheme: scheme,
      removeBorder: 'true',
      removePadding: 'true',
    };
    let cancelled = false;
    ensureScript()
      .then(() => {
        if (!cancelled) w.theAnimeCommunity?.reload?.();
      })
      .catch(() => {
        /* embed is optional — never break the page if TAC is unreachable */
      });
    return () => {
      cancelled = true;
    };
  }, [anilistId, chapter, scheme]);

  // live timestamp bridge — re-dispatches TAC clicks for the Watch player.
  // Origin-checked: only the TAC embed frame may drive player seeks.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://theanimecommunity.com') return;
      if (
        e.data?.type === 'TAC-TIMESTAMP-CLICK' &&
        typeof e.data?.time === 'number'
      ) {
        window.dispatchEvent(
          new CustomEvent('comments:timestamp-click', {
            detail: { time: e.data.time },
          }),
        );
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <>
      <TacLoginNotice />
      <Section>
      <Container>
        <TitleBar onClick={() => setShowFrame((v) => !v)}>
          <TitleWrapper>
            <div>
              <Label>The Anime Community</Label>
              Comments
            </div>
            <ButtonWrapper>
              <CommentButton
                type='button'
                data-active={animeActive ? 'true' : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFrame(true);
                }}
              >
                <FaComments />
                {' ANIME'}
              </CommentButton>
              {/* EP {n} button is omitted: canShowEpisode is false (episodeNumber 0) */}
            </ButtonWrapper>
          </TitleWrapper>
        </TitleBar>
        <FrameWrap $hidden={!visible}>
          <Frame id={FRAME_ID} />
        </FrameWrap>
      </Container>
    </Section>
    </>
  );
};

export default InfoComments;
