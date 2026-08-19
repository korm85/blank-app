// Maps a free-form day name (Russian or English, any case, with or without trailing punctuation)
// to the JS weekday convention used across the app: 0=Sunday .. 6=Saturday.
const DAY_NAME_MAP: Record<string, number> = {
  // Russian
  'воскресенье': 0, 'вс': 0,
  'понедельник': 1, 'пн': 1,
  'вторник': 2, 'вт': 2,
  'среда': 3, 'ср': 3,
  'четверг': 4, 'чт': 4,
  'пятница': 5, 'пт': 5,
  'суббота': 6, 'сб': 6,
  // Hebrew
  'ראשון': 0, 'יום ראשון': 0,
  'שני': 1, 'יום שני': 1,
  'שלישי': 2, 'יום שלישי': 2,
  'רביעי': 3, 'יום רביעי': 3,
  'חמישי': 4, 'יום חמישי': 4,
  'שישי': 5, 'יום שישי': 5,
  'שבת': 6,
  // English
  'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6,
}

export function parseDayName(day: string): number | null {
  const key = day.trim().toLowerCase()
  if (key in DAY_NAME_MAP) return DAY_NAME_MAP[key]
  return null
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/

export function parseTimeLocal(time: string): string | null {
  const match = TIME_RE.exec(time.trim())
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}
