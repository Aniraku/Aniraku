export function selectQualityInList(qualityList, url) {
  return (Array.isArray(qualityList) ? qualityList : []).map((quality) => ({
    ...quality,
    default: quality.url === url,
  }))
}
