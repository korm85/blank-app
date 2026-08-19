export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendTelegramMessage, sendTelegramVoice } from '@/lib/telegram'
import { speak } from '@/lib/voice'
import { fromRow } from '@/lib/anna/profile'
import { runAnna } from '@/lib/anna/agent'
import { nextOccurrence, weekStart, isWithinQuietHours } from '@/lib/time'
import type { Profile } from '@/types'

const NUDGE_AFTER_MS = 2 * 60 * 60 * 1000 // 2h since the first prompt
const MISSED_AFTER_MS = 6 * 60 * 60 * 1000 // 6h since the first prompt, unresolved
const NUDGE_TRIGGER = '[Система: Мила ещё не ответила на предыдущее сообщение. Мягко напомни ещё раз, одной короткой фразой — это последнее напоминание на сегодня.]'

async function notify(profile: Profile, text: string) {
  await sendTelegramMessage(profile.chatId, text)
  if (profile.voiceEnabled) {
    const audio = await speak(text, profile.language)
    if (audio) await sendTelegramVoice(profile.chatId, audio)
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (!process.env.CRON_SECRET || url.searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()
  const now = new Date()
  const { data: profileRows } = await supabase.from('profiles').select('*').eq('onboarded', true)
  const profiles = (profileRows ?? []).map(fromRow)

  const summary: Record<string, string[]> = {}

  for (const profile of profiles) {
    const log: string[] = []
    if (!isWithinQuietHours(now, profile.timezone)) {
      summary[profile.id] = ['skipped: outside quiet hours']
      continue
    }

    // 1. Fire due sessions that haven't been prompted yet.
    const { data: due } = await supabase
      .from('sessions')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(1)

    if (due?.[0]) {
      const reply = await runAnna({ profile, userText: null })
      await notify(profile, reply)
      await supabase
        .from('sessions')
        .update({ status: 'prompted', prompt_count: 1, last_prompted_at: now.toISOString() })
        .eq('id', due[0].id)
        .eq('status', 'pending') // don't clobber a status the reply's own tool call may have already changed
      log.push(`checked in: session ${due[0].id}`)
    }

    // 2. One nudge for sessions prompted a while ago with no resolution yet.
    const { data: stale } = await supabase
      .from('sessions')
      .select('id, last_prompted_at')
      .eq('profile_id', profile.id)
      .eq('status', 'prompted')
      .eq('prompt_count', 1)
      .order('scheduled_for', { ascending: true })
      .limit(1)

    if (stale?.[0] && stale[0].last_prompted_at) {
      const elapsed = now.getTime() - new Date(stale[0].last_prompted_at).getTime()
      if (elapsed >= NUDGE_AFTER_MS) {
        const reply = await runAnna({ profile, userText: NUDGE_TRIGGER })
        await notify(profile, reply)
        await supabase
          .from('sessions')
          .update({ prompt_count: 2, last_prompted_at: now.toISOString() })
          .eq('id', stale[0].id)
        log.push(`nudged: session ${stale[0].id}`)
      }
    }

    // 3. Give up quietly on sessions that went unresolved too long.
    const { data: overdue } = await supabase
      .from('sessions')
      .select('id, last_prompted_at')
      .eq('profile_id', profile.id)
      .eq('status', 'prompted')

    for (const s of overdue ?? []) {
      if (!s.last_prompted_at) continue
      if (now.getTime() - new Date(s.last_prompted_at).getTime() >= MISSED_AFTER_MS) {
        await supabase.from('sessions').update({ status: 'missed' }).eq('id', s.id)
        log.push(`missed: session ${s.id}`)
      }
    }

    // 4. Keep the pipeline full — seed the next occurrence for each active schedule day.
    const { data: schedules } = await supabase
      .from('schedules')
      .select('weekday, time_local')
      .eq('profile_id', profile.id)
      .eq('active', true)

    for (const sched of schedules ?? []) {
      const occurrence = nextOccurrence(sched.weekday, sched.time_local, profile.timezone, now)
      const { data: exists } = await supabase
        .from('sessions')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('scheduled_for', occurrence.toISOString())
        .maybeSingle()
      if (!exists) {
        await supabase.from('sessions').insert({
          profile_id: profile.id,
          scheduled_for: occurrence.toISOString(),
          week_start: weekStart(occurrence, profile.timezone),
          status: 'pending',
          origin: 'scheduled',
        })
        log.push(`seeded: ${occurrence.toISOString()}`)
      }
    }

    summary[profile.id] = log
  }

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), summary })
}
