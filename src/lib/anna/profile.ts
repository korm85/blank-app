import { getServiceSupabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export function fromRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    waChatId: row.wa_chat_id as string,
    name: row.name as string,
    language: row.language as Profile['language'],
    timezone: row.timezone as string,
    onboarded: row.onboarded as boolean,
    voiceEnabled: row.voice_enabled as boolean,
    createdAt: row.created_at as string,
  }
}

/** Finds or creates the profile for an incoming WhatsApp chat. First contact seeds `name: Мила`. */
export async function getOrCreateProfile(waChatId: string): Promise<Profile> {
  const supabase = getServiceSupabase()

  const { data: existing } = await supabase.from('profiles').select('*').eq('wa_chat_id', waChatId).maybeSingle()
  if (existing) return fromRow(existing)

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      wa_chat_id: waChatId,
      name: 'Мила',
      timezone: process.env.MILA_TIMEZONE || 'Asia/Jerusalem',
    })
    .select('*')
    .single()
  if (error || !created) throw new Error(`Failed to create profile: ${error?.message}`)
  return fromRow(created)
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = getServiceSupabase()
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  return data ? fromRow(data) : null
}
