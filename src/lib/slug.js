// ponytail: slug generation + ID extraction, one function each
// Legacy browser storage and some upstream payloads can represent a title as
// an AniList-style object. Resolve only known text fields before any string
// operation so UI routes never crash while rendering a persisted list item.
export function titleText(title) {
  if (typeof title === 'string') return title
  if (typeof title === 'number') return String(title)
  if (!title || typeof title !== 'object' || Array.isArray(title)) return ''

  const candidate = [
    title.userPreferred,
    title.english,
    title.romaji,
    title.native,
    title.title,
  ].find((value) => typeof value === 'string' && value.trim())

  return candidate || ''
}

export function generateSlug(title) {
  return titleText(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '')
}
export default generateSlug

export function extractIdFromSlug(slugId) {
  if (!slugId) return null
  const s = String(slugId)
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  const lastHyphen = s.lastIndexOf('-')
  if (lastHyphen === -1) return /^\d+$/.test(s) ? parseInt(s, 10) : null
  const tail = s.slice(lastHyphen + 1)
  return /^\d+$/.test(tail) ? parseInt(tail, 10) : null
}
