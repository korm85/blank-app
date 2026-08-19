export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendWhatsApp, sendWhatsAppVoice, downloadIncomingFile } from '@/lib/whatsapp'
import { speak, transcribe } from '@/lib/voice'
import { getOrCreateProfile } from '@/lib/anna/profile'
import { runAnna } from '@/lib/anna/agent'

// GET: webhook verification ping from Green API (must return 200)
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

  const idMessage = (body.idMessage as string | undefined) ?? null
  const supabase = getServiceSupabase()
  const { error: logError } = await supabase.from('webhook_log').insert({
    received_at: new Date().toISOString(),
    type: body.typeWebhook ?? 'unknown',
    payload: JSON.stringify(body).slice(0, 2000),
    id_message: idMessage,
  })
  // A unique-violation on id_message means Green API retried a webhook we already processed.
  if (logError) {
    if (logError.code === '23505') return new NextResponse('OK', { status: 200 })
    console.error('[webhook_log insert]', JSON.stringify(logError))
  }

  if (body.typeWebhook !== 'incomingMessageReceived') {
    return new NextResponse('OK', { status: 200 })
  }

  const senderData = body.senderData as Record<string, string> | undefined
  const messageData = body.messageData as Record<string, unknown> | undefined
  const chatId = senderData?.chatId ?? ''
  if (!chatId) return new NextResponse('OK', { status: 200 })

  const typeMessage = messageData?.typeMessage as string | undefined
  let text: string | null = null

  if (typeMessage === 'textMessage') {
    const textData = messageData?.textMessageData as Record<string, string> | undefined
    text = (textData?.textMessage ?? '').trim() || null
  } else if (typeMessage === 'audioMessage' || typeMessage === 'voiceMessage') {
    const fileData = messageData?.fileMessageData as Record<string, string> | undefined
    const downloadUrl = fileData?.downloadUrl
    if (downloadUrl) {
      const audio = await downloadIncomingFile(downloadUrl)
      if (audio) text = await transcribe(audio)
    }
  }

  if (!text) return new NextResponse('OK', { status: 200 })

  const profile = await getOrCreateProfile(chatId)
  const reply = await runAnna({ profile, userText: text })

  await sendWhatsApp(chatId, reply)
  if (profile.voiceEnabled) {
    const audio = await speak(reply, profile.language)
    if (audio) await sendWhatsAppVoice(chatId, audio)
  }

  return new NextResponse('OK', { status: 200 })
}
