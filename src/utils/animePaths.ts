// ---------------------------------------------------------------------------
// Shared anime path helpers — SINGLE SOURCE for slug-bearing navigation.
//
// Byte-for-byte copies of the live link helpers proven in src/pages/Info.tsx
// (live links chunk `links-DAv5tLmw.js` — `Q/$/kt/At` = slugify/pickTitle/
// infoPathFor/watchPathFor). Info.tsx keeps its internal copies untouched
// (forbidden file); every OTHER emitter routes through this module instead of
// the legacy useApi `animeSlug/infoPath` (different algorithm) or hand-rolled
// `/watch/{id}` strings.
//
// Spec: NFD-normalize → strip combining marks → lowercase → drop
// `[^a-z0-9\s-]` → trim → collapse spaces/dashes; pick shortest of
// english||romaji, else native, else String(id); emit the slug only when it
// is non-empty AND !== String(id), else the bare id path.
// ---------------------------------------------------------------------------

// live Q(e) — slugify (NFD-strip → lowercase → strip non-slug → spaces to '-').
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export interface LinkableTitle {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

// live $(title, id) — shortest of trimmed [english, romaji], else native,
// else String(id).
export const pickTitle = (title: LinkableTitle | undefined, fallbackId: string): string => {
  const candidates = [title?.english, title?.romaji]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  if (candidates.length > 0) {
    return [...candidates].sort((a, b) => a.length - b.length)[0];
  }
  return title?.native ?? String(fallbackId);
};

export interface Linkable {
  id: string | number;
  title?: LinkableTitle;
}

// live kt(media) — /info/{id}/{slug}, dropping the slug when empty / equal id.
export const infoPathFor = (item: Linkable): string => {
  const id = String(item.id);
  const slug = slugify(pickTitle(item.title, id));
  return slug && slug !== id
    ? `/info/${item.id}/${slug}`
    : `/info/${item.id}`;
};

// live At(media, ep?) — /watch/{id}/{slug} (+ ?ep= only when ep != null).
export const watchPathFor = (item: Linkable, episode?: number | null): string => {
  const id = String(item.id);
  const slug = slugify(pickTitle(item.title, id));
  const base =
    slug && slug !== id
      ? `/watch/${item.id}/${slug}`
      : `/watch/${item.id}`;
  return episode == null ? base : `${base}?ep=${episode}`;
};
