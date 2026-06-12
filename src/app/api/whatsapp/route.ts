export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'
import { sendWhatsApp } from '@/lib/whatsapp'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Green API sends a GET to verify the webhook — just return 200
export async function GET() {
  return new NextResponse('OK', { status: 200 })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new NextResponse('OK', { status: 200 })
  }

  // Only handle incoming text messages
  if (body.typeWebhook !== 'incomingMessageReceived') {
    return new NextResponse('OK', { status: 200 })
  }

  const senderData = body.senderData as Record<string, string> | undefined
  const messageData = body.messageData as Record<string, unknown> | undefined
  const chatId = senderData?.chatId ?? ''
  const senderName = senderData?.senderName ?? 'Someone'

  const textData = messageData?.textMessageData as Record<string, string> | undefined
  const text = (textData?.textMessage ?? '').trim().toLowerCase()

  if (!text.startsWith('!')) return new NextResponse('OK', { status: 200 })

  const reply = await handleCommand(text, chatId, senderName)
  if (reply) await sendWhatsApp(chatId, reply)

  return new NextResponse('OK', { status: 200 })
}

async function handleCommand(text: string, chatId: string, senderName: string): Promise<string> {
  if (text === '!ping') {
    return `🏓 Pong! Bot is alive. Chat ID: ${chatId}`
  }

  if (text === '!help') {
    return (
      '⚽ *Boys For Goals — Commands*\n\n' +
      '!leaderboard — current standings\n' +
      '!scores — today\'s matches\n' +
      '!mybets — your bets today\n' +
      '!setup — show this chat\'s ID\n' +
      '!ping — check bot is alive\n' +
      '!help — this message'
    )
  }

  if (text === '!setup') {
    return `🔧 Chat ID: ${chatId}\n\nAdd this as the GREEN_API_CHAT env var in Vercel.`
  }

  if (text === '!leaderboard') {
    return await buildLeaderboard()
  }

  if (text === '!scores') {
    return await buildScores()
  }

  if (text === '!mybets') {
    return await buildMyBets(senderName)
  }

  return ''
}

async function buildLeaderboard(): Promise<string> {
  try {
    const supabase = getSupabase()
    const { data: users } = await supabase.from('users').select('id, name')
    const { data: bets } = await supabase
      .from('bets')
      .select('user_id, points_earned')
      .not('points_earned', 'is', null)

    if (!users || !bets) return '❌ Could not load leaderboard.'

    const totals: Record<string, { name: string; pts: number }> = {}
    for (const u of users) totals[u.id] = { name: u.name, pts: 0 }
    for (const b of bets) {
      if (totals[b.user_id]) totals[b.user_id].pts += b.points_earned ?? 0
    }

    const ranked = Object.values(totals).sort((a, b) => b.pts - a.pts)
    if (ranked.length === 0) return '📊 No scores yet — matches still to come!'

    const medals = ['🥇', '🥈', '🥉']
    const lines = ranked.map((e, i) => `${medals[i] ?? `${i + 1}.`} ${e.name} — ${e.pts} pts`)
    return `⚽ *Leaderboard*\n\n${lines.join('\n')}`
  } catch {
    return '❌ Error fetching leaderboard.'
  }
}

async function buildScores(): Promise<string> {
  try {
    const supabase = getSupabase()
    const today = new Date().toISOString().slice(0, 10)
    const todayMatches = GROUP_STAGE_MATCHES.filter(m => m.kickoffUtc.startsWith(today))

    if (todayMatches.length === 0) return `📅 No matches today (${today}).`

    const { data: dbMatches } = await supabase
      .from('matches')
      .select('id, home_score, away_score, status')
      .in('id', todayMatches.map(m => m.id))

    const scoreMap: Record<string, { home: number | null; away: number | null; status: string }> = {}
    for (const m of dbMatches ?? []) {
      scoreMap[m.id] = { home: m.home_score, away: m.away_score, status: m.status }
    }

    const lines = todayMatches.map(m => {
      const db = scoreMap[m.id]
      const kickoff = new Date(m.kickoffUtc).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
      const flag1 = m.homeTeam.flag
      const flag2 = m.awayTeam.flag
      const code1 = m.homeTeam.code
      const code2 = m.awayTeam.code

      if (db?.status === 'finished' && db.home !== null) {
        return `${flag1} ${code1} ${db.home}–${db.away} ${code2} ${flag2} ✅`
      }
      if (db?.status === 'live' && db.home !== null) {
        return `${flag1} ${code1} ${db.home}–${db.away} ${code2} ${flag2} 🔴 LIVE`
      }
      return `${flag1} ${code1} vs ${code2} ${flag2} — ${kickoff}`
    })

    return `📅 *Today's Matches*\n\n${lines.join('\n')}`
  } catch {
    return '❌ Error fetching scores.'
  }
}

async function buildMyBets(senderName: string): Promise<string> {
  try {
    const supabase = getSupabase()
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .ilike('name', senderName)

    const user = users?.[0]
    if (!user) return `❓ No player found named "${senderName}". Check your name in the app.`

    const today = new Date().toISOString().slice(0, 10)
    const todayMatchIds = GROUP_STAGE_MATCHES
      .filter(m => m.kickoffUtc.startsWith(today))
      .map(m => m.id)

    const { data: bets } = await supabase
      .from('bets')
      .select('match_id, home_score, away_score, points_earned')
      .eq('user_id', user.id)
      .in('match_id', todayMatchIds)

    if (!bets || bets.length === 0) return `📋 ${senderName}, you have no bets on today's matches.`

    const lines = bets.map(b => {
      const match = GROUP_STAGE_MATCHES.find(m => m.id === b.match_id)
      if (!match) return null
      const pts = b.points_earned !== null ? ` → ${b.points_earned} pts` : ''
      return `${match.homeTeam.flag} ${match.homeTeam.code} ${b.home_score}–${b.away_score} ${match.awayTeam.code} ${match.awayTeam.flag}${pts}`
    }).filter(Boolean)

    return `📋 *${senderName}'s bets today*\n\n${lines.join('\n')}`
  } catch {
    return '❌ Error fetching bets.'
  }
}
