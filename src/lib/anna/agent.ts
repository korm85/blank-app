import Anthropic from '@anthropic-ai/sdk'
import { getServiceSupabase } from '@/lib/supabase'
import { ANNA_SYSTEM_PROMPT } from '@/lib/anna/prompt'
import { ANNA_TOOLS } from '@/lib/anna/tools'
import { buildStateBlock } from '@/lib/anna/state'
import * as actions from '@/lib/anna/actions'
import type { Profile, MessageRole } from '@/types'

const MODEL = process.env.ANNA_MODEL || 'claude-haiku-4-5'
const MAX_HISTORY = 20
const MAX_TOOL_ROUNDS = 4
const CHECKIN_TRIGGER = '[Система: наступило время плановой тренировки — начни проверку по Режиму 2.]'

async function loadHistory(profileId: string): Promise<Anthropic.MessageParam[]> {
  const supabase = getServiceSupabase()
  const { data } = await supabase
    .from('messages')
    .select('role, content')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY)
  const rows = (data ?? []).reverse() as { role: MessageRole; content: string }[]
  return rows.map(r => ({ role: r.role, content: r.content }))
}

async function persist(profileId: string, role: MessageRole, content: string) {
  const supabase = getServiceSupabase()
  await supabase.from('messages').insert({ profile_id: profileId, role, content })
}

async function executeTool(profile: Profile, name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'set_weekly_schedule':
      return actions.setWeeklySchedule(profile.id, profile.timezone, input as {
        day_1: string; time_1: string; day_2: string; time_2: string; duration_minutes: number
      })
    case 'delay_workout_today':
      return actions.delayWorkoutToday(profile.id, profile.timezone, input as {
        delay_hours: number; new_time: string
      })
    case 'reschedule_workout_day':
      return actions.rescheduleWorkoutDay(profile.id, profile.timezone, input as {
        original_day: string; new_day: string; new_time: string
      })
    case 'log_workout_completed':
      return actions.logWorkoutCompleted(profile.id, profile.timezone)
    default:
      return { ok: false, message: `Unknown tool ${name}` }
  }
}

export interface RunAnnaOptions {
  profile: Profile
  /** Мила's actual message text, or null to fire a scheduled check-in. */
  userText: string | null
}

export async function runAnna({ profile, userText }: RunAnnaOptions): Promise<string> {
  const triggerText = userText ?? CHECKIN_TRIGGER
  await persist(profile.id, 'user', triggerText)

  const state = await buildStateBlock(profile)
  const history = await loadHistory(profile.id)
  // The just-persisted trigger row is the last history entry; augment it with live state for
  // this call only — the stored row keeps the plain text.
  const messages: Anthropic.MessageParam[] = history.length
    ? [...history.slice(0, -1), { role: 'user', content: `${triggerText}\n\n${state}` }]
    : [{ role: 'user', content: `${triggerText}\n\n${state}` }]

  const anthropic = new Anthropic()
  let finalText = ''

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: [{ type: 'text', text: ANNA_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: ANNA_TOOLS,
      messages,
    })

    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text')
    finalText = textBlocks.map(b => b.text).join(' ').trim()

    if (response.stop_reason !== 'tool_use') break

    messages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      const result = await executeTool(profile, block.name, block.input as Record<string, unknown>)
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
    }
    messages.push({ role: 'user', content: toolResults })
  }

  if (!finalText) finalText = 'Извините, у меня небольшая заминка — напишите, пожалуйста, ещё раз.'

  await persist(profile.id, 'assistant', finalText)
  return finalText
}
