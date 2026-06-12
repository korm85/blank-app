export const runtime = 'nodejs'

// POST /api/whatsapp/notify
// Body: { adminKey, message } — sends a message to the WhatsApp group
// Used by cron / score update flow to push notifications

import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, getGroupChatId } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { adminKey, message } = body

  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chatId = getGroupChatId()
  if (!chatId) {
    return NextResponse.json({ error: 'green_api_chat not set' }, { status: 500 })
  }

  const ok = await sendWhatsApp(chatId, message)
  return NextResponse.json({ ok })
}
