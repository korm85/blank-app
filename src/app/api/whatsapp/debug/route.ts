export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

const KNOWN_GROUP_ID = '120363212878988352@g.us'

export async function GET() {
  const id = process.env.green_api_id
    ?? process.env.GREEN_API_ID           // accept either case
  const token = process.env.green_api_token
    ?? process.env.GREEN_API_TOKEN
  const chat = process.env.green_api_chat
    ?? process.env.GREEN_API_CHAT
    ?? KNOWN_GROUP_ID

  const envStatus = {
    green_api_id: id ? `set (${id})` : '❌ MISSING — add in Vercel with Preview checked',
    green_api_token: token ? 'set (hidden)' : '❌ MISSING — add in Vercel with Preview checked',
    green_api_chat: chat === KNOWN_GROUP_ID ? `using hardcoded default (${KNOWN_GROUP_ID})` : `set (${chat})`,
    note: 'Var names are case-sensitive: use green_api_id / green_api_token (all lowercase)',
  }

  if (!id || !token) {
    return NextResponse.json({ ok: false, problem: 'Env vars missing', env: envStatus })
  }

  // Check Green API instance state
  let instanceState = 'unknown'
  try {
    const res = await fetch(`https://api.green-api.com/waInstance${id}/getStateInstance/${token}`)
    const data = await res.json() as Record<string, unknown>
    instanceState = (data.stateInstance as string) ?? JSON.stringify(data)
  } catch (e) {
    instanceState = `fetch error: ${e}`
  }

  // Try sending a test ping to the Boys group
  let sendResult = 'not attempted (instance not authorized)'
  if (instanceState === 'authorized') {
    try {
      const res = await fetch(`https://api.green-api.com/waInstance${id}/sendMessage/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat, message: '🔧 Bot debug test — if you see this in the group, sending works!' }),
      })
      const data = await res.json() as Record<string, unknown>
      sendResult = res.ok
        ? `✅ sent to ${chat}, idMessage: ${data.idMessage}`
        : `❌ failed: ${JSON.stringify(data)}`
    } catch (e) {
      sendResult = `❌ error: ${e}`
    }
  }

  return NextResponse.json({
    ok: instanceState === 'authorized',
    instanceState,
    sendTest: sendResult,
    env: envStatus,
    hint: instanceState !== 'authorized'
      ? '⚠️ Instance not authorized — open Green API console and re-scan the QR code, then retry'
      : sendResult.startsWith('✅')
        ? '✅ All good — if !ping still fails in WhatsApp, check the webhook URL is saved in Green API → Account settings'
        : '⚠️ Instance authorized but send failed — check the response above',
  })
}
