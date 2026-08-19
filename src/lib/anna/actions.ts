import { getServiceSupabase } from '@/lib/supabase'
import { nextOccurrence, weekStart, zonedTimeToUtc } from '@/lib/time'
import { parseDayName, parseTimeLocal } from '@/lib/anna/days'
import type { WorkoutSession } from '@/types'

interface ActionResult {
  ok: boolean
  message: string
  [key: string]: unknown
}

function err(message: string): ActionResult {
  return { ok: false, message }
}

/** The session Мила is currently negotiating: earliest not-yet-resolved session. */
export async function pickCurrentSession(profileId: string): Promise<WorkoutSession | null> {
  const supabase = getServiceSupabase()
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .in('status', ['pending', 'prompted'])
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    profileId: data.profile_id,
    scheduledFor: data.scheduled_for,
    weekStart: data.week_start,
    status: data.status,
    origin: data.origin,
    promptCount: data.prompt_count,
    lastPromptedAt: data.last_prompted_at,
  }
}

export async function setWeeklySchedule(
  profileId: string,
  timezone: string,
  args: { day_1: string; time_1: string; day_2: string; time_2: string; duration_minutes: number }
): Promise<ActionResult> {
  const weekday1 = parseDayName(args.day_1)
  const weekday2 = parseDayName(args.day_2)
  const time1 = parseTimeLocal(args.time_1)
  const time2 = parseTimeLocal(args.time_2)
  if (weekday1 === null || weekday2 === null) return err('Не удалось распознать день недели.')
  if (!time1 || !time2) return err('Не удалось распознать время.')
  if (weekday1 === weekday2) return err('Нужны два разных дня недели.')
  const duration = Math.min(Math.max(Math.round(args.duration_minutes) || 20, 10), 60)

  const supabase = getServiceSupabase()

  await supabase.from('schedules').update({ active: false }).eq('profile_id', profileId).eq('active', true)

  const rows = [
    { profile_id: profileId, weekday: weekday1, time_local: time1, duration_minutes: duration, active: true },
    { profile_id: profileId, weekday: weekday2, time_local: time2, duration_minutes: duration, active: true },
  ]
  const { error: insertError } = await supabase.from('schedules').insert(rows)
  if (insertError) return err('Не получилось сохранить расписание.')

  // Cancel any sessions that no longer match the new schedule, then seed the next occurrence
  // of each new day so a check-in fires without waiting for the cron's weekly rollover.
  await supabase
    .from('sessions')
    .update({ status: 'rescheduled' })
    .eq('profile_id', profileId)
    .in('status', ['pending', 'prompted'])

  const now = new Date()
  for (const [weekday, timeLocal] of [[weekday1, time1], [weekday2, time2]] as const) {
    const occurrence = nextOccurrence(weekday, timeLocal, timezone, now)
    await supabase.from('sessions').insert({
      profile_id: profileId,
      scheduled_for: occurrence.toISOString(),
      week_start: weekStart(occurrence, timezone),
      status: 'pending',
      origin: 'scheduled',
    })
  }

  await supabase.from('profiles').update({ onboarded: true }).eq('id', profileId)

  return { ok: true, message: 'Расписание сохранено.', day_1: args.day_1, time_1: time1, day_2: args.day_2, time_2: time2 }
}

export async function delayWorkoutToday(
  profileId: string,
  timezone: string,
  args: { delay_hours: number; new_time: string }
): Promise<ActionResult> {
  const session = await pickCurrentSession(profileId)
  if (!session) return err('Нет тренировки, которую можно перенести сегодня.')

  const delayHours = Math.min(Math.max(Math.round(args.delay_hours) || 1, 1), 3)
  const newTime = parseTimeLocal(args.new_time)
  if (!newTime) return err('Не удалось распознать новое время.')

  const original = new Date(session.scheduledFor)
  const [hh, mm] = newTime.split(':').map(Number)
  if (hh > 20) return err('Слишком поздно — предложите время до 21:00.')

  const newInstant = zonedTimeToUtc(original.getUTCFullYear(), original.getUTCMonth() + 1, original.getUTCDate(), hh, mm, timezone)
  // must stay same local day and genuinely later than now
  if (weekStart(newInstant, timezone) !== session.weekStart) return err('Перенос должен остаться в тот же день.')
  if (newInstant.getTime() <= Date.now()) return err('Новое время уже прошло — предложите время позже.')

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('sessions')
    .update({ scheduled_for: newInstant.toISOString(), status: 'pending', origin: 'delayed', prompt_count: 0 })
    .eq('id', session.id)
  if (error) return err('Не получилось перенести тренировку.')

  return { ok: true, message: 'Тренировка перенесена на сегодня позже.', delay_hours: delayHours, new_time: newTime }
}

export async function rescheduleWorkoutDay(
  profileId: string,
  timezone: string,
  args: { original_day: string; new_day: string; new_time: string }
): Promise<ActionResult> {
  const session = await pickCurrentSession(profileId)
  if (!session) return err('Нет тренировки, которую можно перенести.')

  const newWeekday = parseDayName(args.new_day)
  const newTime = parseTimeLocal(args.new_time)
  if (newWeekday === null) return err('Не удалось распознать новый день недели.')
  if (!newTime) return err('Не удалось распознать время.')

  const original = new Date(session.scheduledFor)
  const originalWeekday = original.getUTCDay()
  if (newWeekday === originalWeekday) return err('Нужен другой день недели.')

  // find the matching weekday within the same Mon-Sun week as the original session
  const [hh, mm] = newTime.split(':').map(Number)
  let found: Date | null = null
  for (let i = -6; i <= 6; i++) {
    const candidate = new Date(original.getTime() + i * 86400000)
    if (candidate.getUTCDay() !== newWeekday) continue
    const instant = zonedTimeToUtc(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate(), hh, mm, timezone)
    if (weekStart(instant, timezone) === session.weekStart) {
      found = instant
      break
    }
  }
  if (!found) return err('Новый день должен быть на той же неделе.')
  if (found.getTime() <= Date.now()) return err('Этот день и время уже прошли — выберите другое время.')

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('sessions')
    .update({ scheduled_for: found.toISOString(), status: 'pending', origin: 'rescheduled', prompt_count: 0 })
    .eq('id', session.id)
  if (error) return err('Не получилось перенести тренировку.')

  return { ok: true, message: 'Тренировка перенесена на другой день этой недели.', new_day: args.new_day, new_time: newTime }
}

export async function logWorkoutCompleted(profileId: string, timezone: string): Promise<ActionResult> {
  const session = await pickCurrentSession(profileId)
  if (!session) return err('Нет тренировки для отметки на сегодня.')

  const supabase = getServiceSupabase()
  const { error } = await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id)
  if (error) return err('Не получилось отметить тренировку.')

  const { count } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('week_start', session.weekStart)
    .eq('status', 'completed')

  return { ok: true, message: 'Тренировка засчитана.', completed: count ?? 1, weekly_goal: 2 }
}
