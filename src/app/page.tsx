'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { getUpcomingDaysMatches, getNextMatch, GROUP_STAGE_MATCHES } from '@/data/schedule'
import { MatchCard } from '@/components/match/MatchCard'
import { BetSheet } from '@/components/match/BetSheet'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { supabase } from '@/lib/supabase'
import type { Bet, Match } from '@/types'
import { formatMatchDate } from '@/lib/utils'

function groupByDate(matches: Match[]): { date: string; label: string; matches: Match[] }[] {
  const groups: Record<string, Match[]> = {}
  for (const m of matches) {
    const dateKey = m.kickoffUtc.split('T')[0]
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(m)
  }
  return Object.entries(groups).map(([date, ms]) => ({
    date,
    label: formatMatchDate(ms[0].kickoffUtc),
    matches: ms,
  }))
}

export default function TodayPage() {
  const { userId, isLoggedIn } = useUser()
  const [matches, setMatches] = useState<Match[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  const loadData = useCallback(async () => {
    const upcoming = getUpcomingDaysMatches(2)

    try {
      const { data: dbMatches } = await supabase
        .from('matches')
        .select('*')
        .in('id', upcoming.map(m => m.id))

      if (dbMatches && dbMatches.length > 0) {
        setMatches(upcoming.map(m => {
          const db = dbMatches.find((d: Record<string, unknown>) => d.id === m.id)
          if (!db) return m
          return { ...m, homeScore: db.home_score ?? null, awayScore: db.away_score ?? null, status: db.status ?? m.status }
        }))
      } else {
        setMatches(upcoming)
      }
    } catch {
      setMatches(upcoming)
    }

    if (userId && upcoming.length > 0) {
      try {
        const { data: betData } = await supabase
          .from('bets')
          .select('*')
          .in('match_id', upcoming.map(m => m.id))

        if (betData) {
          setBets(betData.map((b: Record<string, unknown>) => ({
            id: b.id as string,
            userId: b.user_id as string,
            matchId: b.match_id as string,
            homeScore: b.home_score as number,
            awayScore: b.away_score as number,
            pointsEarned: b.points_earned as number | null,
            createdAt: b.created_at as string,
          })))
        }
      } catch { /* supabase not configured yet */ }
    }

    setLoading(false)
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  // Seed schedule to DB on first load
  useEffect(() => {
    const syncSchedule = async () => {
      try {
        const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true })
        if (count === 0) {
          const rows = GROUP_STAGE_MATCHES.map(m => ({
            id: m.id,
            home_team_name: m.homeTeam.name,
            home_team_code: m.homeTeam.code,
            home_team_flag: m.homeTeam.flag,
            away_team_name: m.awayTeam.name,
            away_team_code: m.awayTeam.code,
            away_team_flag: m.awayTeam.flag,
            kickoff_utc: m.kickoffUtc,
            venue: m.venue,
            city: m.city,
            stage: m.stage,
            group_name: m.group,
            matchday: m.matchday,
            status: 'scheduled',
          }))
          await supabase.from('matches').insert(rows)
        }
      } catch { /* ignore */ }
    }
    syncSchedule()
  }, [])

  if (!isLoggedIn) return <UserSelector />

  const groups = groupByDate(matches)
  const nextMatch = matches.length === 0 ? getNextMatch() : null
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Page title */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Upcoming Games
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {loading ? (
        <div className="px-4 space-y-4 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl shimmer" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="px-4 pb-6 space-y-6 mt-2">
          {groups.map(({ date, label, matches: dayMatches }) => (
            <div key={date}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}>
                {date === today ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#FFD60A', color: '#0D0D0F' }}>
                    Today
                  </span>
                ) : label}
              </h3>
              <div className="space-y-3">
                {dayMatches.map((m, i) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    index={i}
                    userBet={bets.find(b => b.matchId === m.id && b.userId === userId)}
                    onClick={() => setActiveMatch(m)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : nextMatch ? (
        <div className="px-4 mt-4 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No games in the next 2 days. Next match:
          </p>
          <MatchCard
            match={nextMatch}
            userBet={bets.find(b => b.matchId === nextMatch.id && b.userId === userId)}
            onClick={() => setActiveMatch(nextMatch)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <span className="text-5xl mb-4">🏆</span>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            World Cup done!
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Check the leaderboard.
          </p>
        </div>
      )}

      <BetSheet
        match={activeMatch}
        bets={bets}
        currentUserId={userId}
        onClose={() => setActiveMatch(null)}
        onBetPlaced={loadData}
      />
    </div>
  )
}
