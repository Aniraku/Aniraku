export function chooseBrowserPlayableEmbed(sources, isBrowserPlayableEmbedSource) {
  const candidates = (Array.isArray(sources) ? sources : [])
    .filter((source) => source?.url && isBrowserPlayableEmbedSource(source))

  // mp4upload currently redirects repeatedly in the browser. Prefer another
  // eligible same-provider embed when one is supplied, but retain it as the
  // final fallback so this helper does not silently drop a usable provider.
  return candidates.find((source) => !/mp4upload\.com\/embed/i.test(source.url)) || candidates[0] || null
}
