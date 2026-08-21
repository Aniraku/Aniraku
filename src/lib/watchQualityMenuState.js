export function getQualitySettingTitle(quality) {
  const label = String(quality?.label || quality?.qualityKey || 'Auto')
  return `Quality · ${label}`
}

export function getHlsQualitySettingDisplay(levels, activeLevel) {
  const selectedLevel = Array.isArray(levels)
    ? levels.find((level) => Number(level?.index) === Number(activeLevel))
    : null
  const height = Number(selectedLevel?.height || 0)
  const label = Number(activeLevel) === -1 || height <= 0 ? 'Auto' : `${height}p`

  return {
    label,
    title: getQualitySettingTitle({ label }),
  }
}

export function createHlsQualitySelection(initialLevel = -1) {
  let selectedLevel = Number(initialLevel)
  if (!Number.isInteger(selectedLevel) || selectedLevel < 0) selectedLevel = -1

  return {
    getSelectedLevel() {
      return selectedLevel
    },
    selectLevel(nextLevel) {
      const candidate = Number(nextLevel)
      selectedLevel = Number.isInteger(candidate) && candidate >= 0 ? candidate : -1
      return selectedLevel
    },
  }
}

export function selectQualityInList(qualityList, url) {
  return (Array.isArray(qualityList) ? qualityList : []).map((quality) => ({
    ...quality,
    default: quality.url === url,
  }))
}
