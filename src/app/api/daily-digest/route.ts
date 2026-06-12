export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'
import { sendWhatsApp, getGroupChatId } from '@/lib/whatsapp'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const adminKey = req.nextUrl.searchParams.get('adminKey')
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chatId = getGroupChatId()
  if (!chatId) return NextResponse.json({ error: 'green_api_chat not set' }, { status: 500 })

  const message = await buildDigest()
  await sendWhatsApp(chatId, message)
  return NextResponse.json({ ok: true, message })
}

// Called by Vercel cron — no auth check needed since it's internal
export async function POST() {
  const chatId = getGroupChatId()
  if (!chatId) return new NextResponse('no chat id', { status: 500 })
  const message = await buildDigest()
  await sendWhatsApp(chatId, message)
  return new NextResponse('ok')
}

async function buildDigest(): Promise<string> {
  const supabase = getSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const lines: string[] = ['⚽ *Boys For Goals — Daily Update*\n']

  // ── Favourite teams section ──────────────────────────────────────────────
  try {
    const { data: users } = await supabase
      .from('users')
      .select('name, favorite_team')
      .not('favorite_team', 'is', null)

    if (users && users.length > 0) {
      const uniqueTeamCodes = [...new Set(users.map((u: { name: string; favorite_team: string }) => u.favorite_team as string))]

      // Yesterday's results for their teams
      const yesterdayMatches = GROUP_STAGE_MATCHES.filter(m => m.kickoffUtc.startsWith(yesterday))
      const { data: yesterdayDb } = await supabase
        .from('matches')
        .select('id, home_score, away_score, status')
        .in('id', yesterdayMatches.map(m => m.id))
        .eq('status', 'finished')

      const finishedMap: Record<string, { home: number; away: number }> = {}
      for (const r of yesterdayDb ?? []) finishedMap[r.id] = { home: r.home_score, away: r.away_score }

      const relevantYesterday = yesterdayMatches.filter(m =>
        finishedMap[m.id] &&
        (uniqueTeamCodes.includes(m.homeTeam.code) || uniqueTeamCodes.includes(m.awayTeam.code))
      )

      if (relevantYesterday.length > 0) {
        lines.push('📋 *Yesterday\'s results:*')
        for (const m of relevantYesterday) {
          const r = finishedMap[m.id]
          lines.push(`${m.homeTeam.flag} ${m.homeTeam.code} ${r.home}–${r.away} ${m.awayTeam.code} ${m.awayTeam.flag}`)
        }
        lines.push('')
      }

      // Today's matches for their teams
      const todayMatches = GROUP_STAGE_MATCHES.filter(m =>
        m.kickoffUtc.startsWith(today) &&
        (uniqueTeamCodes.includes(m.homeTeam.code) || uniqueTeamCodes.includes(m.awayTeam.code))
      )

      if (todayMatches.length > 0) {
        lines.push('📅 *Today — your teams play:*')
        for (const m of todayMatches) {
          const kickoff = new Date(m.kickoffUtc).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
          })
          // Which player roots for this team?
          const fan = users.find((u: { name: string; favorite_team: string }) =>
            u.favorite_team === m.homeTeam.code || u.favorite_team === m.awayTeam.code
          )
          const fanNote = fan ? ` (${fan.name}'s team)` : ''
          lines.push(`${m.homeTeam.flag} ${m.homeTeam.code} vs ${m.awayTeam.code} ${m.awayTeam.flag} — ${kickoff} UTC${fanNote}`)
        }
        lines.push('')
      }
    }
  } catch { /* favorite_team column may not exist yet */ }

  // ── All today's matches (if not already covered) ──────────────────────────
  const todayAll = GROUP_STAGE_MATCHES.filter(m => m.kickoffUtc.startsWith(today))
  if (todayAll.length > 0) {
    lines.push('📅 *All matches today:*')
    for (const m of todayAll) {
      const kickoff = new Date(m.kickoffUtc).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
      })
      lines.push(`${m.homeTeam.flag} ${m.homeTeam.code} vs ${m.awayTeam.code} ${m.awayTeam.flag} — ${kickoff} UTC`)
    }
    lines.push('')
  } else {
    lines.push('📅 No matches today.\n')
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  try {
    const { data: users } = await supabase.from('users').select('id, name')
    const { data: bets } = await supabase
      .from('bets')
      .select('user_id, points_earned')
      .not('points_earned', 'is', null)

    if (users && bets) {
      const totals: Record<string, { name: string; pts: number }> = {}
      for (const u of users) totals[u.id] = { name: u.name, pts: 0 }
      for (const b of bets) {
        if (totals[b.user_id]) totals[b.user_id].pts += b.points_earned ?? 0
      }
      const ranked = Object.values(totals).sort((a, b) => b.pts - a.pts)
      if (ranked.some(r => r.pts > 0)) {
        lines.push('🏆 *Standings:*')
        const medals = ['🥇', '🥈', '🥉']
        ranked.forEach((r, i) => lines.push(`${medals[i] ?? `${i + 1}.`} ${r.name} — ${r.pts} pts`))
        lines.push('')
      }
    }
  } catch { /* ignore */ }

  lines.push('💬 Type !help for commands')

  return lines.join('\n')
}
