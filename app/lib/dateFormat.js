export function formatDisplayDate(value, fallback = "N/A") {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  return date.toLocaleDateString()
}

export function toDateInputValue(value) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

export function dateInputToStartOfDayIso(value) {
  if (!value) return null
  return new Date(`${value}T00:00:00`).toISOString()
}

export function dateInputToEndOfDayIso(value) {
  if (!value) return null
  return new Date(`${value}T23:59:59`).toISOString()
}
