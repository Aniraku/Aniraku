// ---------------------------------------------------------------------------
// Shared Random action — SINGLE SOURCE for the Navbar dice (Navbar.tsx:68-82
// pre-extraction) and the mobile bottom-nav Random tab (BottomNav.tsx). Body
// moved verbatim so there is no logic drift between the two callers:
//   trending fetch → filterAdult NSFW pool → navigate(infoPathFor(pick)).
// The explicit `filterAdult<Anime>` type arg is REQUIRED for TS (verbatim).
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Anime } from '../hooks/animeInterface';
import { fetchTrendingAnime } from '../hooks/useApi';
import { filterAdult, useNsfw } from '../hooks/useNsfw';
import { infoPathFor } from './animePaths';

type NavigateFn = (path: string) => void;

// Aniraku Random semantics (Navbar's original inline copy): fetch the
// trending pool, exclude Hentai-genre titles while NSFW is off, pick one,
// navigate to its info path.
export const runRandomAnime = async (
  nsfwEnabled: boolean,
  navigate: NavigateFn,
): Promise<void> => {
  try {
    const trending = await fetchTrendingAnime(1, 20);
    // Aniraku Random.jsx:319 — filter the candidate pool before the pick.
    const list = filterAdult<Anime>(trending.results ?? [], nsfwEnabled);
    if (list.length > 0) {
      const randomIndex = Math.floor(Math.random() * list.length);
      navigate(infoPathFor(list[randomIndex]));
    } else {
      console.error('No trending anime available for random selection');
    }
  } catch (error) {
    console.error('Error fetching random anime:', error);
  }
};

// Hook wrapper: binds router navigate + the shared NSFW flag (useNsfw is
// multi-instance safe by design — see useNsfw.ts shared state). Returns a
// stable callback for onClick.
export const useRandomAnime = (): (() => void) => {
  const navigate = useNavigate();
  const { nsfwEnabled } = useNsfw();
  return useCallback(
    () => void runRandomAnime(nsfwEnabled, navigate),
    [nsfwEnabled, navigate],
  );
};
