export function getQualitySettingTitle(quality) {
  const label = String(quality?.label || quality?.qualityKey || 'Auto')
  return `Quality · ${label}`
}

export function selectQualityInList(qualityList, url) {
  return (Array.isArray(qualityList) ? qualityList : []).map((quality) => ({
    ...quality,
    default: quality.url === url,
  }))
}
