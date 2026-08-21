export function getQualitySettingTitle(quality) {
  const label = String(quality?.label || quality?.qualityKey || 'Auto')
  return `Quality · ${label}`
}

export function getHlsDataSaverCap(levels) {
  const candidates = (Array.isArray(levels) ? levels : [])
    .filter((level) => Number.isInteger(Number(level?.index)) && Number(level?.height) > 0)
    .sort((a, b) => Number(b.height) - Number(a.height))
  if (candidates.length < 2) return null

  return candidates.find((level) => Number(level.height) <= 480) || candidates.at(-1)
}

export function getHlsQualitySettingDisplay(levels, activeLevel, dataSaverCap = null) {
  const dataSaverLevel = Array.isArray(levels)
    ? levels.find((level) => Number(level?.index) === Number(dataSaverCap))
    : null
  const dataSaverHeight = Number(dataSaverLevel?.height || 0)
  if (
    dataSaverCap !== null &&
    dataSaverCap !== undefined &&
    Number.isInteger(Number(dataSaverCap)) &&
    Number(dataSaverCap) >= 0 &&
    dataSaverHeight > 0
  ) {
    const label = `Data Saver · ≤${dataSaverHeight}p`
    return { label, title: getQualitySettingTitle({ label }) }
  }

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
