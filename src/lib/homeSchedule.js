function validAiringAt(value) {
  const timestamp = Number(value)
  return Number.isInteger(timestamp) && timestamp > 0 ? timestamp : null
}

export function createHomeScheduleDays(now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      label: index === 0 ? 'Today' : date.toLocaleDateString([], { weekday: 'short' }),
      key: date.toDateString(),
      date,
    }
  })
}

export function groupHomeScheduleRows(schedule, days, excludedId = null) {
  const rows = Array.isArray(schedule) ? schedule : []
  const calendarDays = Array.isArray(days) ? days : []
  return calendarDays.map((day) => rows
    .filter((item) => item?.id && item.id !== excludedId)
    .filter((item) => {
      const airingAt = validAiringAt(item?.nextAiringEpisode?.airingAt)
      return airingAt && new Date(airingAt * 1000).toDateString() === day?.key
    })
    .sort((left, right) => Number(left.nextAiringEpisode.airingAt) - Number(right.nextAiringEpisode.airingAt)))
}

export function initialPopulatedScheduleDayIndex(groupedRows) {
  if (!Array.isArray(groupedRows) || !groupedRows.length || groupedRows[0]?.length) return 0
  const firstPopulated = groupedRows.findIndex((rows) => Array.isArray(rows) && rows.length > 0)
  return firstPopulated >= 0 ? firstPopulated : 0
}
