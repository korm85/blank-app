import { getServiceSupabase } from '@/lib/supabase'
import { weekStart, weekdayNameRu } from '@/lib/time'
import { pickCurrentSession } from '@/lib/anna/actions'
import type { Profile } from '@/types'

export async function buildStateBlock(profile: Profile, now: Date = new Date()): Promise<string> {
  const supabase = getServiceSupabase()
  const currentWeekStart = weekStart(now, profile.timezone)

  const { count } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .eq('week_start', currentWeekStart)
    .eq('status', 'completed')

  const session = await pickCurrentSession(profile.id)

  const localNow = new Intl.DateTimeFormat('ru-RU', {
    timeZone: profile.timezone,
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  }).format(now)

  const lines = [
    `Сейчас: ${localNow} (${profile.timezone}).`,
    `Имя: ${profile.name}.`,
    `Онбординг пройден: ${profile.onboarded ? 'да' : 'нет'}.`,
    `Тренировок выполнено на этой неделе: ${count ?? 0} из 2.`,
  ]

  if (session) {
    const sessionLocal = new Intl.DateTimeFormat('ru-RU', {
      timeZone: profile.timezone,
      weekday: 'long', hour: '2-digit', minute: '2-digit',
    }).format(new Date(session.scheduledFor))
    lines.push(`Ближайшая/текущая тренировка: ${sessionLocal}, статус "${session.status}", источник "${session.origin}".`)
    lines.push(`День недели этой тренировки: ${weekdayNameRu(new Date(session.scheduledFor).getUTCDay())}.`)
  } else {
    lines.push('Активной тренировки на сейчас нет.')
  }

  return `<state>\n${lines.join('\n')}\n</state>`
}
