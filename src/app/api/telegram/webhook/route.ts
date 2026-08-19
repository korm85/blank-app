export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendTelegramMessage, sendTelegramVoice, downloadTelegramFile } from '@/lib/telegram'
import { speak, transcribe } from '@/lib/voice'
import { getOrCreateProfile } from '@/lib/anna/profile'
import { runAnna } from '@/lib/anna/agent'

// GET ?log=1: recent webhook log entries, for debugging
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get('log') === '1') {
    const supabase = getServiceSupabase()
    const { data } = await supabase
      .from('webhook_log')
      .select('received_at, type, payload')
      .order('received_at', { ascending: false })
      .limit(10)
    return NextResponse.json({ entries: data ?? [] })
  }
  return new NextResponse('OK', { status: 200 })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new NextResponse('OK', { status: 200 })
  }

  const updateId = (body.update_id as number | undefined) ?? null
  const supabase = getServiceSupabase()
  const { error: logError } = await supabase.from('webhook_log').insert({
    received_at: new Date().toISOString(),
    type: 'message',
    payload: JSON.stringify(body).slice(0, 2000),
    update_id: updateId,
  })
  // A unique-violation on update_id means Telegram retried a webhook we already processed.
  if (logError) {
    if (logError.code === '23505') return new NextResponse('OK', { status: 200 })
    console.error('[webhook_log insert]', JSON.stringify(logError))
  }

  const message = body.message as Record<string, unknown> | undefined
  const chat = message?.chat as Record<string, unknown> | undefined
  const chatId = chat?.id !== undefined ? String(chat.id) : ''
  if (!chatId) return new NextResponse('OK', { status: 200 })

  let text: string | null = null
  if (typeof message?.text === 'string') {
    text = message.text.trim() || null
  } else if (message?.voice) {
    const voice = message.voice as Record<string, unknown>
    const fileId = voice.file_id as string | undefined
    if (fileId) {
      const audio = await downloadTelegramFile(fileId)
      if (audio) text = await transcribe(audio)
    }
  }

  if (!text) return new NextResponse('OK', { status: 200 })

  const profile = await getOrCreateProfile(chatId)
  const reply = await runAnna({ profile, userText: text })

  await sendTelegramMessage(chatId, reply)
  if (profile.voiceEnabled) {
    const audio = await speak(reply, profile.language)
    if (audio) await sendTelegramVoice(chatId, audio)
  }

  return new NextResponse('OK', { status: 200 })
}
