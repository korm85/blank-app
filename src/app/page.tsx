'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getUpcomingDaysMatches, getNextMatch, GROUP_STAGE_MATCHES } from '@/data/schedule'
import { MatchCard } from '@/components/match/MatchCard'
import { BetSheet } from '@/components/match/BetSheet'
import { Avatar } from '@/components/ui/Avatar'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { usePlayers } from '@/components/providers/PlayersProvider'
import { supabase } from '@/lib/supabase'
import { getFavoriteTeamCode } from '@/lib/favorites'
import { formatMatchDate } from '@/lib/utils'
import type { Bet, Match } from '@/types'

function getTeamFlag(code: string): string {
  for (const m of GROUP_STAGE_MATCHES) {
    if (m.homeTeam.code === code) return m.homeTeam.flag
    if (m.awayTeam.code === code) return m.awayTeam.flag
  }
  return ''
}

function groupByDate(matches: Match[]) {
  const groups: Record<string, Match[]> = {}
  for (const m of matches) {
    const key = m.kickoffUtc.split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return Object.entries(groups).map(([date, ms]) => ({
    date,
    label: formatMatchDate(ms[0].kickoffUtc),
    matches: ms,
  }))
}

type Standing = {
  id: string; name: string; color: string; avatarUrl: string | null
  favFlag: string; totalPoints: number; exactScores: number; rank: number
}

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#FFD60A', '#C0C0C0', '#CD7F32']

export default function DashboardPage() {
  const { userId, isLoggedIn } = useUser()
  const { players } = usePlayers()
  const [standings, setStandings] = useState<Standing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  const loadData = useCallback(async () => {
    // Show next 4 matches where betting is still open, plus any live/today matches
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const upcoming = GROUP_STAGE_MATCHES
      .filter(m => m.kickoffUtc.slice(0, 10) >= todayStr)
      .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime())
      .slice(0, 4)

    // Standings: load all graded bets
    try {
      const { data: allBets } = await supabase
        .from('bets').select('user_id, points_earned')
      const pts: Record<string, { total: number; exact: number }> = {}
      for (const b of allBets ?? []) {
        if (!pts[b.user_id]) pts[b.user_id] = { total: 0, exact: 0 }
        if (b.points_earned != null) {
          pts[b.user_id].total += b.points_earned as number
          if (b.points_earned === 10) pts[b.user_id].exact++
        }
      }
      setStandings(
        [...players]
          .map(p => ({
            id: p.id, name: p.name, color: p.color, avatarUrl: p.avatarUrl,
            favFlag: getTeamFlag(getFavoriteTeamCode(p.id)),
            totalPoints: pts[p.id]?.total ?? 0,
            exactScores: pts[p.id]?.exact ?? 0,
            rank: 0,
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores)
          .map((s, i) => ({ ...s, rank: i + 1 }))
      )
    } catch { /* fallback: just players with 0 pts */ }

    // Upcoming matches
    if (upcoming.length > 0) {
      try {
        const { data: dbMatches } = await supabase.from('matches').select('*')
          .in('id', upcoming.map(m => m.id))
        setMatches(upcoming.map(m => {
          const db = (dbMatches ?? []).find((d: Record<string, unknown>) => d.id === m.id)
          if (!db) return m
          return { ...m, homeScore: db.home_score as number ?? null, awayScore: db.away_score as number ?? null, status: (db.status as Match['status']) ?? m.status }
        }))
      } catch { setMatches(upcoming) }

      if (userId) {
        try {
          const { data } = await supabase.from('bets').select('*')
            .in('match_id', upcoming.map(m => m.id))
          setBets((data ?? []).map((b: Record<string, unknown>) => ({
            id: b.id as string, userId: b.user_id as string, matchId: b.match_id as string,
            homeScore: b.home_score as number, awayScore: b.away_score as number,
            pointsEarned: b.points_earned as number | null, createdAt: b.created_at as string,
          })))
        } catch { /* ignore */ }
      }
    } else {
      setMatches([])
    }

    setLoading(false)
  }, [userId, players])

  useEffect(() => { loadData() }, [loadData])

  // Seed schedule to DB on first load
  useEffect(() => {
    const sync = async () => {
      try {
        const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true })
        if (count === 0) {
          await supabase.from('matches').insert(GROUP_STAGE_MATCHES.map(m => ({
            id: m.id,
            home_team_name: m.homeTeam.name, home_team_code: m.homeTeam.code, home_team_flag: m.homeTeam.flag,
            away_team_name: m.awayTeam.name, away_team_code: m.awayTeam.code, away_team_flag: m.awayTeam.flag,
            kickoff_utc: m.kickoffUtc, venue: m.venue, city: m.city,
            stage: m.stage, group_name: m.group, matchday: m.matchday, status: 'scheduled',
          })))
        }
      } catch { /* ignore */ }
    }
    sync()
  }, [])

  if (!isLoggedIn) return <UserSelector />

  const today = new Date().toISOString().split('T')[0]
  const nextMatch = matches.length === 0 ? getNextMatch() : null

  return (
    <div className="min-h-dvh pb-4" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Standings ──────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-1">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {standings.map((s, i) => {
            const isMe = s.id === userId
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{
                  backgroundColor: isMe ? `${s.color}12` : 'transparent',
                  borderLeft: `3px solid ${isMe ? s.color : 'transparent'}`,
                  borderBottom: i < standings.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span className="w-6 text-center text-base leading-none flex-shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>{s.rank}</span>}
                </span>
                <Avatar name={s.name} color={s.color} avatarUrl={s.avatarUrl} size="sm" />
                <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {s.name}
                </span>
                {s.favFlag && (
                  <span className="text-base flex-shrink-0">{s.favFlag}</span>
                )}
                {isMe && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${s.color}22`, color: s.color, fontWeight: 700 }}>
                    You
                  </span>
                )}
                <span
                  className="text-sm font-black tabular-nums flex-shrink-0 w-10 text-right"
                  style={{ color: i < 3 ? MEDAL_COLORS[i] : 'var(--text-primary)' }}
                >
                  {s.totalPoints}
                </span>
              </div>
            )
          })}
          <Link href="/leaderboard">
            <div className="px-4 py-2.5 text-center text-xs font-semibold"
              style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}>
              Full standings →
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ── Upcoming bets ─────────────────────────────────────────── */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Up next
          </h3>
          <Link href="/bets" className="text-xs font-semibold" style={{ color: '#FFD60A' }}>
            All matches →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3 pb-2">
            {matches.map((m, i) => (
              <MatchCard
                key={m.id} match={m} index={i}
                userBet={bets.find(b => b.matchId === m.id && b.userId === userId)}
                onClick={() => setActiveMatch(m)}
              />
            ))}
          </div>
        ) : nextMatch ? (
          <div className="space-y-3 pb-2">
            <MatchCard match={nextMatch}
              userBet={bets.find(b => b.matchId === nextMatch.id && b.userId === userId)}
              onClick={() => setActiveMatch(nextMatch)} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">🏆</span>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>World Cup done!</p>
          </div>
        )}
      </div>

      <BetSheet
        match={activeMatch} bets={bets} currentUserId={userId}
        onClose={() => setActiveMatch(null)} onBetPlaced={loadData}
      />
    </div>
  )
}
