// =============================================================
// Aniraku Client-Side SEO Helper (TS port of Aniraku's src/lib/seo.js)
// Handles dynamic document.title, meta tags, canonical URLs,
// and JSON-LD structured data for SPA route changes.
//
// Usage (inside a page component):
//   useSeo({
//     title: 'Schedule — ... | Aniraku',
//     description: '...',
//     canonicalPath: '/schedule',      // → https://www.aniraku.tech/schedule
//     jsonLd: breadcrumbLd('Schedule', '/schedule'),
//     noindex: false,                   // optional robots noindex
//   });
//
// Cleanup semantics: every injected JSON-LD node carries a stable
// `id="seo-jsonld-N"` so (a) re-applying replaces leftovers instead of
// stacking duplicates, and (b) unmount removes exactly the nodes this hook
// injected. Static site-level JSON-LD from index.html never matches the id
// prefix and is never touched.
// =============================================================
import { useEffect } from 'react';

/** Canonical site origin — visible/canonical brand domain. */
export const SITE_URL = 'https://www.aniraku.tech';

export interface SeoOptions {
  /** Document title + <title> + og:title + twitter:title + meta[name=title]. */
  title: string;
  /** meta[name=description] + og:description + twitter:description (optional). */
  description?: string;
  /**
   * Path appended to SITE_URL for <link rel="canonical">, og:url and
   * twitter:url. Omit to leave canonical/URL metas untouched.
   */
  canonicalPath?: string;
  /** JSON-LD node(s) injected as <script type="application/ld+json">. */
  jsonLd?: object | object[];
  /** When true, robots meta becomes "noindex, nofollow" (default: indexable). */
  noindex?: boolean;
  /**
   * og:image + twitter:image (+ twitter:card=summary_large_image). Ported for
   * Info/Watch parity with old setAnimeDetailSEO/setWatchSEO image handling.
   */
  image?: string;
  /** og:type override (e.g. 'video.tv_show', 'video.episode'); defaults 'website'. */
  ogType?: string;
  /**
   * Separate og/twitter:description — old seo.js splits the meta description
   * sentence from the og plot description. Defaults to `description`.
   */
  ogDescription?: string;
  /** meta[name=keywords] — old per-page setMeta('keywords', …) parity. */
  keywords?: string;
}

const JSON_LD_ID_PREFIX = 'seo-jsonld-';
const INDEX_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

/** Set (or create) <meta name="..."> content. */
function setMeta(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Set (or create) <meta property="..."> content (og:*, twitter:*). */
function setMetaProperty(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Point <link rel="canonical"> at SITE_URL + path (created if missing). */
function setCanonical(path: string): void {
  const href = `${SITE_URL}${path}`;
  const el =
    (document.getElementById('canonical-link') as HTMLLinkElement | null) ??
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (el) {
    el.href = href;
  } else {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.id = 'canonical-link';
    link.href = href;
    document.head.appendChild(link);
  }
}

/** Remove every JSON-LD node this helper injected (id-prefix match only). */
function clearStructuredData(): void {
  document
    .querySelectorAll(`script[id^="${JSON_LD_ID_PREFIX}"]`)
    .forEach((el) => el.remove());
}

/** Replace injected JSON-LD wholesale — never leaves duplicates behind. */
function setStructuredData(nodes: object[]): void {
  clearStructuredData();
  nodes.forEach((node, index) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `${JSON_LD_ID_PREFIX}${index}`;
    script.textContent = JSON.stringify(node);
    document.head.appendChild(script);
  });
}

/**
 * BreadcrumbList shaped like Aniraku's seo.js (Home → current page).
 * Exported so Watch/Info integrations can reuse it later.
 */
export function breadcrumbLd(name: string, path: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: `${SITE_URL}${path}` },
    ],
  };
}

/**
 * Route-level SEO hook. Applies title/meta/canonical/robots/JSON-LD on
 * mount (and whenever the options change), removes its injected JSON-LD
 * on unmount. Safe under React StrictMode double-invocation.
 */
export function useSeo(options: SeoOptions): void {
  const {
    title,
    description,
    ogDescription,
    canonicalPath,
    ogType,
    image,
    keywords,
    jsonLd,
    noindex,
  } = options;
  // Stable dep for inline object/array literals.
  const jsonLdKey = jsonLd === undefined ? '' : JSON.stringify(jsonLd);

  useEffect(() => {
    // --- Title -----------------------------------------------------------
    document.title = title;
    setMeta('title', title);
    setMetaProperty('og:title', title);
    setMetaProperty('twitter:title', title);

    // --- Description -----------------------------------------------------
    if (description !== undefined) {
      setMeta('description', description);
    }
    // og/twitter description — separate value when provided (old seo.js
    // splits the meta sentence from the og plot description), else shared.
    const socialDescription = ogDescription ?? description;
    if (socialDescription !== undefined) {
      setMetaProperty('og:description', socialDescription);
      setMetaProperty('twitter:description', socialDescription);
    }

    // --- Canonical + social URLs ----------------------------------------
    if (canonicalPath !== undefined) {
      setCanonical(canonicalPath);
      const url = `${SITE_URL}${canonicalPath}`;
      setMetaProperty('og:url', url);
      setMetaProperty('twitter:url', url);
      setMetaProperty('og:type', ogType ?? 'website');
    }

    // --- Social image (old setAnimeDetailSEO/setWatchSEO image parity) ---
    if (image !== undefined) {
      setMetaProperty('og:image', image);
      setMetaProperty('twitter:image', image);
      setMetaProperty('twitter:card', 'summary_large_image');
    }

    // --- Per-page keywords (old setMeta('keywords', …) parity) -----------
    if (keywords !== undefined) {
      setMeta('keywords', keywords);
    }

    // --- Robots (always written so a previous noindex can't go stale) ----
    setMeta('robots', noindex === true ? 'noindex, nofollow' : INDEX_ROBOTS);

    // --- JSON-LD ---------------------------------------------------------
    if (jsonLd === undefined) {
      clearStructuredData();
    } else {
      setStructuredData(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
    }

    return clearStructuredData;
    // jsonLdKey is the serialised form of jsonLd (inline literals).
  }, [
    title,
    description,
    ogDescription,
    canonicalPath,
    ogType,
    image,
    keywords,
    noindex,
    jsonLdKey,
  ]);
}
