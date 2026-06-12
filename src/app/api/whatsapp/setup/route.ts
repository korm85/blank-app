export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

const BASE_WEBHOOK_URL = 'https://blank-app-korm85s-projects.vercel.app/api/whatsapp'

export async function GET(req: NextRequest) {
  const id = process.env.green_api_id ?? process.env.GREEN_API_ID
  const token = process.env.green_api_token ?? process.env.GREEN_API_TOKEN

  if (!id || !token) {
    return NextResponse.json({ ok: false, error: 'green_api_id / green_api_token env vars missing' })
  }

  // Allow passing a Vercel Protection Bypass token so Green API can reach the webhook
  // through Vercel's Deployment Protection (SSO).
  // Get yours: Vercel → Project → Settings → Deployment Protection → Protection Bypass for Automation
  const bypass = new URL(req.url).searchParams.get('bypass')
  const WEBHOOK_URL = bypass
    ? `${BASE_WEBHOOK_URL}?x-vercel-protection-bypass=${bypass}`
    : BASE_WEBHOOK_URL

  const base = `https://api.green-api.com/waInstance${id}`
  const steps: Record<string, unknown> = {
    webhookUrl: WEBHOOK_URL,
    bypassTokenProvided: !!bypass,
  }

  // Step 1: Re-register webhook settings
  try {
    const res = await fetch(`${base}/setSettings/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: WEBHOOK_URL,
        incomingWebhook: 'yes',
        outgoingMessageWebhook: 'no',
        delaySendMessagesMilliseconds: 1000,
      }),
    })
    steps.setSettings = res.ok ? '✅ webhook re-registered' : `❌ ${res.status} ${await res.text()}`
  } catch (e) {
    steps.setSettings = `❌ error: ${e}`
  }

  // Step 2: Reboot the instance to clear any webhook delivery suspension
  try {
    const res = await fetch(`${base}/reboot/${token}`)
    const data = await res.json() as Record<string, unknown>
    steps.reboot = res.ok ? `✅ rebooted (isReboot: ${data.isReboot})` : `❌ ${res.status}`
  } catch (e) {
    steps.reboot = `❌ error: ${e}`
  }

  // Step 3: Wait 3s then verify settings
  await new Promise(r => setTimeout(r, 3000))

  try {
    const res = await fetch(`${base}/getSettings/${token}`)
    const data = await res.json() as Record<string, unknown>
    steps.verifySettings = {
      webhookUrl: data.webhookUrl,
      incomingWebhook: data.incomingWebhook,
      match: data.webhookUrl === WEBHOOK_URL ? '✅' : '❌ URL mismatch',
    }
  } catch (e) {
    steps.verifySettings = `❌ error: ${e}`
  }

  // Step 4: Confirm instance state
  try {
    const res = await fetch(`${base}/getStateInstance/${token}`)
    const data = await res.json() as Record<string, unknown>
    steps.instanceState = data.stateInstance
  } catch (e) {
    steps.instanceState = `❌ error: ${e}`
  }

  return NextResponse.json({
    ok: true,
    steps,
    next: bypass
      ? 'Wait ~30 seconds for the instance to fully reboot, then send !ping in the group.'
      : '⚠️ No bypass token provided. If Vercel Authentication is blocking requests, re-run with ?bypass=TOKEN. Get the token from: Vercel → Project → Settings → Deployment Protection → Protection Bypass for Automation.',
  })
}
