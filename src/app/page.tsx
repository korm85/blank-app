'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTodayMatches, getNextMatch, GROUP_STAGE_MATCHES } from '@/data/schedule'
import { MatchHero } from '@/components/match/MatchHero'
import { MatchCard } from '@/components/match/MatchCard'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { supabase } from '@/lib/supabase'
import type { Bet, Match } from '@/types'
import { isToday } from '@/lib/utils'

export default function TodayPage() {
  const { userId, isLoggedIn } = useUser()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  // Get today's matches from static schedule, merge with live DB data
  const [matches, setMatches] = useState<Match[]>([])

  const loadData = useCallback(async () => {
    // Get today's matches from schedule
    const todayMatches = getTodayMatches()

    // Try to fetch updated match data from DB
    try {
      const { data: dbMatches } = await supabase
        .from('matches')
        .select('*')
        .in('id', todayMatches.map(m => m.id))

      if (dbMatches && dbMatches.length > 0) {
        // Merge DB data with static schedule
        const merged = todayMatches.map(m => {
          const db = dbMatches.find((d: Record<string, unknown>) => d.id === m.id)
          if (!db) return m
          return {
            ...m,
            homeScore: db.home_score ?? null,
            awayScore: db.away_score ?? null,
            status: db.status ?? m.status,
          }
        })
        setMatches(merged)
      } else {
        setMatches(todayMatches)
      }
    } catch {
      setMatches(todayMatches)
    }

    // Load bets for today's matches
    if (userId) {
      try {
        const { data: betData } = await supabase
          .from('bets')
          .select('*')
          .in('match_id', todayMatches.map(m => m.id))

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

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sync schedule to DB on first load
  useEffect(() => {
    const syncSchedule = async () => {
      try {
        const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true })
        if (count === 0) {
          // Seed all matches
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

  const heroMatch = matches[0] ?? getNextMatch()
  const otherMatches = matches.slice(1)

  // Check if there are upcoming matches (not necessarily today)
  const nextMatch = !matches.length ? getNextMatch() : null

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Date header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {matches.length > 0 ? "Today's Games" : 'Next Up'}
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {loading ? (
        <div className="px-4 space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 rounded-3xl shimmer" />
          ))}
        </div>
      ) : heroMatch ? (
        <AnimatePresence mode="wait">
          <motion.div key="content" className="space-y-4">
            <MatchHero
              match={heroMatch}
              bets={bets.filter(b => b.matchId === heroMatch.id)}
              currentUserId={userId}
              onBetPlaced={loadData}
            />
            {otherMatches.length > 0 && (
              <div className="px-4 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Also Today
                </h3>
                {otherMatches.map((m, i) => (
                  <MatchCard key={m.id} match={m} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : nextMatch ? (
        <div className="px-4">
          <MatchHero
            match={nextMatch}
            bets={bets.filter(b => b.matchId === nextMatch.id)}
            currentUserId={userId}
            onBetPlaced={loadData}
          />
          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
            No games today — next match shown above
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <span className="text-5xl mb-4">🏆</span>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No more games!
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            World Cup 2026 is done. Check the leaderboard!
          </p>
        </div>
      )}
    </div>
  )
}
