import { useEffect, useState } from 'react';

/**
 * Live mediaQuery helpers — `Ue(768)` (comments compact slot) and
 * `He(1200)` (MediaSource moves between the main column `ki` and the
 * source-and-data column `Yn`) — as a tiny SSR-safe matchMedia hook.
 */
export function useMediaQuery(
  query: string,
  defaultValue: boolean = false,
): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // Safari < 14 fallback.
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query, defaultValue]);

  return matches;
}
