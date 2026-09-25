// Upcoming/unreleased fallback copy — ported from old Aniraku
// (`src/lib/watchEpisodeAvailability.js` + Watch.jsx usage).
//
// The episode line is verbatim; the anime/movie siblings are written in the
// same voice (apology + time-travel + promise) for the title-level empty
// state. Classification stays conservative like the original: only an
// explicit unreleased status (or an explicit future-episode request)
// triggers these — a merely-missing episode list keeps the generic empty
// copy, so transient backend gaps are never misreported as unreleased.

/** Verbatim old-Aniraku line for a requested-but-unaired episode. */
export const UPCOMING_EPISODE_MESSAGE =
  'Time travel still has not been invented—sorry, we cannot stream an episode from the future. It will appear here the moment it is officially released.';

/** Same voice, title-level: series/OVA/ONA not yet airing. */
export const UNRELEASED_ANIME_MESSAGE =
  'Time travel still has not been invented—sorry, we cannot stream an anime that has not started airing. It will appear here the moment it officially premieres.';

/** Same voice, title-level: movie not yet premiered. */
export const UNRELEASED_MOVIE_MESSAGE =
  'Time travel still has not been invented—sorry, we cannot screen a movie that has not premiered. It will appear here the moment it is officially released.';

/** Explicit unreleased status in either backend dialect. */
export function isUnreleasedStatus(status: unknown): boolean {
  if (status === null || status === undefined) return false;
  const normalized = String(status)
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '_');
  return normalized === 'NOT_YET_RELEASED' || normalized === 'NOT_YET_AIRED';
}

/** AniList ('MOVIE') or display ('Movie') format strings. */
export function isMovieFormat(format: unknown): boolean {
  if (format === null || format === undefined) return false;
  return String(format).trim().toUpperCase() === 'MOVIE';
}
