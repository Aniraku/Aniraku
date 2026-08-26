const text = (value) => String(value || '').trim()

const isSafeImage = (value) => /^https:\/\//i.test(text(value))

function stableIndex(seed, count) {
  if (!count) return 0
  let hash = 2166136261
  for (const character of text(seed)) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % count
}

function artworkSeed(media) {
  return [media?.id, media?.idMal, media?.title?.english, media?.title?.romaji, media?.title?.userPreferred]
    .map(text)
    .filter(Boolean)
    .join(':') || 'aniraku'
}

export function posterSources(media) {
  const selected = [media?.coverImage?.extraLarge, media?.coverImage?.large, media?.coverImage?.medium]
  const officialOptions = Array.isArray(media?.artwork?.posterOptions) ? media.artwork.posterOptions : []
  return [...new Set([...selected, ...officialOptions].filter(isSafeImage))]
}

export function posterSource(media) {
  return posterSources(media)[0] || ''
}

export function bannerSource(media) {
  return isSafeImage(media?.bannerImage) ? text(media.bannerImage) : posterSource(media)
}

export function artworkTone(media) {
  const providerTone = text(media?.coverImage?.color)
  if (/^(#|rgb\(|hsl\()/i.test(providerTone)) return providerTone
  return `hsl(${stableIndex(`${artworkSeed(media)}:tone`, 360)} 72% 58%)`
}

export function artworkVars(media) {
  return { '--art-tone': artworkTone(media) }
}
