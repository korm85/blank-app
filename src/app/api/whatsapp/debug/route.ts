export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET() {
  const id = process.env.green_api_id
  const token = process.env.green_api_token
  const chat = process.env.green_api_chat

  const envStatus = {
    green_api_id: id ? `set (${id})` : '❌ MISSING',
    green_api_token: token ? 'set (hidden)' : '❌ MISSING',
    green_api_chat: chat ? `set (${chat})` : 'not set (optional)',
  }

  if (!id || !token) {
    return NextResponse.json({
      ok: false,
      problem: 'Env vars missing — set green_api_id and green_api_token in Vercel (enable Preview checkbox)',
      env: envStatus,
    })
  }

  // Check Green API instance state
  let instanceState = 'unknown'
  try {
    const res = await fetch(`https://api.green-api.com/waInstance${id}/getStateInstance/${token}`)
    const data = await res.json()
    instanceState = data.stateInstance ?? JSON.stringify(data)
  } catch (e) {
    instanceState = `fetch error: ${e}`
  }

  // Try sending a test message to yourself (the instance's own number)
  let sendResult = 'not attempted'
  if (instanceState === 'authorized') {
    try {
      const res = await fetch(`https://api.green-api.com/waInstance${id}/sendMessage/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: `${id}@c.us`, message: '🔧 Bot debug test — if you see this, sending works!' }),
      })
      const data = await res.json()
      sendResult = res.ok ? `✅ sent, idMessage: ${data.idMessage}` : `❌ failed: ${JSON.stringify(data)}`
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
      ? 'Instance not authorized — go to Green API console and re-scan the QR code'
      : 'Instance is authorized. If !ping still fails, check that the webhook URL is saved in Green API settings.',
  }, { status: 200 })
}
