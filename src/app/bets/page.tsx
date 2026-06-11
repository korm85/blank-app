'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { BetCard } from '@/components/bet/BetCard'
import { supabase } from '@/lib/supabase'
import { getTodayMatches, GROUP_STAGE_MATCHES } from '@/data/schedule'
import { formatKickoff, isToday } from '@/lib/utils'
import type { Bet, Match } from '@/types'

export default function BetsPage() {
  const { userId, isLoggedIn } = useUser()
  const [bets, setBets] = useState<Bet[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const todayMatchIds = getTodayMatches().map(m => m.id)

    // Get bets for today
    try {
      const { data } = await supabase
        .from('bets')
        .select('*')
        .in('match_id', todayMatchIds)

      if (data) {
        setBets(data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          userId: b.user_id as string,
          matchId: b.match_id as string,
          homeScore: b.home_score as number,
          awayScore: b.away_score as number,
          pointsEarned: b.points_earned as number | null,
          createdAt: b.created_at as string,
        })))
      }
    } catch { /* supabase not connected */ }

    setMatches(getTodayMatches())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (!isLoggedIn) return <UserSelector />

  return (
    <div className="min-h-dvh px-4 py-4">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Today&apos;s Bets
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        See what everyone predicted
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">🗓</span>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No games today</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Check History for past bets</p>
        </div>
      ) : (
        <div className="space-y-5">
          {matches.map((match, mi) => {
            const matchBets = bets.filter(b => b.matchId === match.id)
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mi * 0.08 }}
              >
                {/* Match header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{match.homeTeam.flag}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {match.homeTeam.code}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>vs</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {match.awayTeam.code}
                    </span>
                    <span className="text-lg">{match.awayTeam.flag}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {formatKickoff(match.kickoffUtc)}
                  </span>
                </div>

                {matchBets.length === 0 ? (
                  <p className="text-sm text-center py-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    No bets yet — be the first!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {matchBets.map((bet, bi) => (
                      <BetCard key={bet.id} bet={bet} match={match} index={bi} />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
