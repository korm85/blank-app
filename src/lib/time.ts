// Timezone-correct scheduling helpers, built on Intl (no extra dependency).
// Weekday convention matches JS Date and the `schedules.weekday` column: 0=Sunday .. 6=Saturday.

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function localYMD(date: Date, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) }
}

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const asUtc = Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour), Number(map.minute), Number(map.second)
  )
  return (asUtc - date.getTime()) / 60000
}

/** Converts a local wall-clock date/time in `timeZone` to the corresponding UTC instant. */
export function zonedTimeToUtc(y: number, m: number, d: number, hh: number, mm: number, timeZone: string): Date {
  const guessMs = Date.UTC(y, m - 1, d, hh, mm)
  let offset = tzOffsetMinutes(new Date(guessMs), timeZone)
  let utcMs = guessMs - offset * 60000
  // second pass to settle DST-transition edge cases
  offset = tzOffsetMinutes(new Date(utcMs), timeZone)
  utcMs = guessMs - offset * 60000
  return new Date(utcMs)
}

/** Next UTC instant, strictly after `from`, matching `weekday`/`timeLocal` in `timeZone`. */
export function nextOccurrence(weekday: number, timeLocal: string, timeZone: string, from: Date = new Date()): Date {
  const [hh, mm] = timeLocal.split(':').map(Number)
  const { y, m, d } = localYMD(from, timeZone)
  const baseMs = Date.UTC(y, m - 1, d)
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(baseMs + i * 86400000)
    if (candidate.getUTCDay() !== weekday) continue
    const occurrence = zonedTimeToUtc(
      candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate(), hh, mm, timeZone
    )
    if (occurrence.getTime() > from.getTime()) return occurrence
  }
  throw new Error(`nextOccurrence: no match for weekday ${weekday} within a week`)
}

/** Monday (start of the ISO week) containing `date`, in `timeZone`, as 'YYYY-MM-DD'. */
export function weekStart(date: Date, timeZone: string): string {
  const { y, m, d } = localYMD(date, timeZone)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const diffToMonday = wd === 0 ? -6 : 1 - wd
  const monday = new Date(Date.UTC(y, m - 1, d) + diffToMonday * 86400000)
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`
}

/** True if `date` is inside 08:00–21:00 local time in `timeZone`. */
export function isWithinQuietHours(date: Date, timeZone: string): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', hour: '2-digit',
  }).formatToParts(date)
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0')
  return hour >= 8 && hour < 21
}

const WEEKDAY_NAMES_RU = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

export function weekdayNameRu(weekday: number): string {
  return WEEKDAY_NAMES_RU[weekday] ?? String(weekday)
}
