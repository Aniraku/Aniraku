const GIPHY_HOST = /^(?:media\d*|i)\.giphy\.com$/i

export function isTrustedGiphyGifUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && GIPHY_HOST.test(url.hostname)
  } catch {
    return false
  }
}

export function getCommentDisplayContent(content, gifUrl) {
  const legacySeparator = '||GIF:'
  const rawContent = typeof content === 'string' ? content : ''
  const separatorIndex = rawContent.indexOf(legacySeparator)
  const legacyText = separatorIndex === -1 ? rawContent : rawContent.slice(0, separatorIndex).trimEnd()
  const legacyGif = separatorIndex === -1 ? '' : rawContent.slice(separatorIndex + legacySeparator.length).trim()
  const resolvedGif = isTrustedGiphyGifUrl(gifUrl)
    ? gifUrl
    : (isTrustedGiphyGifUrl(legacyGif) ? legacyGif : '')

  return { text: legacyText, gifUrl: resolvedGif }
}

export function canSubmitComment(content, gifUrl) {
  return Boolean(String(content || '').trim() || isTrustedGiphyGifUrl(gifUrl))
}

export function toGiphyGif(record) {
  const images = record?.images || {}
  const url = images.downsized?.url || images.fixed_width?.url || images.original?.url || ''
  const previewUrl = images.fixed_width_small?.url || images.fixed_width?.url || images.downsized_still?.url || url
  if (!isTrustedGiphyGifUrl(url) || !isTrustedGiphyGifUrl(previewUrl)) return null
  return {
    id: record?.id || url,
    url,
    previewUrl,
    label: String(record?.title || record?.slug || 'Animated reaction').trim() || 'Animated reaction',
  }
}
