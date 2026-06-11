'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { BetCard } from '@/components/bet/BetCard'
import { supabase } from '@/lib/supabase'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'
import { formatMatchDate, formatKickoff } from '@/lib/utils'
import type { Bet, Match } from '@/types'

export default function HistoryPage() {
  const { userId, isLoggedIn } = useUser()
  const [bets, setBets] = useState<Bet[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const now = new Date()
    const pastMatches = GROUP_STAGE_MATCHES.filter(
      m => new Date(m.kickoffUtc) < now
    ).sort((a, b) => new Date(b.kickoffUtc).getTime() - new Date(a.kickoffUtc).getTime())

    // Fetch DB match data (for scores/status)
    try {
      const { data: dbMatches } = await supabase
        .from('matches')
        .select('*')
        .in('id', pastMatches.map(m => m.id))

      let merged = pastMatches
      if (dbMatches) {
        merged = pastMatches.map(m => {
          const db = dbMatches.find((d: Record<string, unknown>) => d.id === m.id)
          if (!db) return m
          return {
            ...m,
            homeScore: db.home_score ?? null,
            awayScore: db.away_score ?? null,
            status: (db.status as Match['status']) ?? m.status,
          }
        })
      }
      setMatches(merged)

      const { data: betData } = await supabase
        .from('bets')
        .select('*')
        .in('match_id', pastMatches.map(m => m.id))

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
    } catch {
      setMatches(pastMatches)
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (!isLoggedIn) return <UserSelector />

  return (
    <div className="min-h-dvh px-4 py-4">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        History
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        All past matches & bets
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">⏳</span>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tournament just started!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            History will appear after games are played
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match, mi) => {
            const matchBets = bets.filter(b => b.matchId === match.id)
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(mi * 0.04, 0.3) }}
              >
                {/* Match header */}
                <div
                  className="rounded-2xl p-4 mb-2"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-secondary)' }}>
                      Group {match.group} · MD{match.matchday}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatMatchDate(match.kickoffUtc)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{match.homeTeam.flag}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{match.homeTeam.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.status === 'finished' ? (
                        <>
                          <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{match.homeScore}</span>
                          <span className="text-lg" style={{ color: 'var(--text-tertiary)' }}>–</span>
                          <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{match.awayScore}</span>
                        </>
                      ) : (
                        <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          {match.status === 'live' ? '🔴 LIVE' : 'TBD'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{match.awayTeam.flag}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{match.awayTeam.code}</span>
                    </div>
                  </div>
                </div>

                {matchBets.length > 0 && (
                  <div className="space-y-2 pl-1">
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
