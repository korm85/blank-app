import { supabase } from '@/lib/supabase'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Called by Vercel Cron daily at 08:00 UTC.
// Also callable with ?test=1&email=you@example.com for a test send.
export async function GET(req: Request) {
  const apiKey = process.env.resend_api
  if (!apiKey) {
    return Response.json({ ok: false, error: 'resend_api not set — add it in Vercel env vars' }, { status: 503 })
  }

  const url = new URL(req.url)
  const testEmail = url.searchParams.get('email')
  const isTest = url.searchParams.has('test')

  // Matches kicking off in the next 24 h (or next 2 h for test)
  const now = new Date()
  const windowHrs = isTest ? 48 : 24
  const cutoff = new Date(now.getTime() + windowHrs * 3_600_000)
  const upcoming = GROUP_STAGE_MATCHES.filter(m => {
    const kick = new Date(m.kickoffUtc)
    return kick > now && kick <= cutoff
  })

  if (upcoming.length === 0) {
    return Response.json({ ok: true, sent: 0, message: 'No upcoming matches in window' })
  }

  // Get users with emails from Supabase
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .not('email', 'is', null)

  const recipients: { name: string; email: string }[] = testEmail
    ? [{ name: 'Test', email: testEmail }]
    : (users ?? []).filter((u: { email: string | null }) => u.email)

  if (recipients.length === 0) {
    return Response.json({ ok: true, sent: 0, message: 'No users with emails saved' })
  }

  const matchList = upcoming
    .map(m => {
      const kick = new Date(m.kickoffUtc)
      const time = kick.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
      return `${m.homeTeam.flag} <b>${m.homeTeam.code}</b> vs <b>${m.awayTeam.code}</b> ${m.awayTeam.flag} — ${time} UTC`
    })
    .join('<br>')

  let sent = 0
  for (const r of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Boys For Goals <onboarding@resend.dev>',
        to: r.email,
        subject: `⚽ ${upcoming.length} match${upcoming.length > 1 ? 'es' : ''} coming up — place your bets!`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#FFD60A">⚽ Boys For Goals</h2>
            <p>Hey ${r.name || 'there'}, upcoming matches to bet on:</p>
            <div style="background:#1c1c1e;border-radius:12px;padding:16px;color:#fff;line-height:2">
              ${matchList}
            </div>
            <p style="color:#888;font-size:12px;margin-top:16px">
              Bets lock at kickoff — don't miss it!
            </p>
          </div>
        `,
      }),
    })
    if (res.ok) sent++
  }

  return Response.json({ ok: true, sent, matches: upcoming.length })
}
