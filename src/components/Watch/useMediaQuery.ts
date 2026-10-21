import { useEffect, useState } from 'react';

/**
 * SSR-safe matchMedia hook used for the compact comments slot (768px) and
 * for MediaSource moving between the main column and the source-and-data
 * column (1200px).
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
