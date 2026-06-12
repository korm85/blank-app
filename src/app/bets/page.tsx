'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UserSelector } from '@/components/ui/UserSelector'
import { BetSheet } from '@/components/match/BetSheet'
import { Avatar } from '@/components/ui/Avatar'
import { useUser } from '@/components/providers/UserProvider'
import { supabase } from '@/lib/supabase'
import { getUpcomingDaysMatches } from '@/data/schedule'
import { formatKickoff, isBettingOpen } from '@/lib/utils'
import { STATIC_USERS } from '@/lib/users'
import type { Bet, Match } from '@/types'

export default function MatchesPage() {
  const { userId, isLoggedIn } = useUser()
  const [bets, setBets] = useState<Bet[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  const load = useCallback(async () => {
    // today only
    const todayMatches = getUpcomingDaysMatches(0)

    try {
      const { data: dbMatches } = await supabase
        .from('matches')
        .select('*')
        .in('id', todayMatches.map(m => m.id))

      if (dbMatches && dbMatches.length > 0) {
        setMatches(todayMatches.map(m => {
          const db = dbMatches.find((d: Record<string, unknown>) => d.id === m.id)
          if (!db) return m
          return { ...m, homeScore: db.home_score ?? null, awayScore: db.away_score ?? null, status: db.status ?? m.status }
        }))
      } else {
        setMatches(todayMatches)
      }
    } catch {
      setMatches(todayMatches)
    }

    if (todayMatches.length > 0) {
      try {
        const { data } = await supabase
          .from('bets')
          .select('*')
          .in('match_id', todayMatches.map(m => m.id))

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
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (!isLoggedIn) return <UserSelector />

  return (
    <div className="min-h-dvh px-4 py-4" style={{ backgroundColor: 'var(--bg)' }}>
      <h2 className="text-xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
        Today&apos;s Matches
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 rounded-3xl shimmer" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">🗓</span>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No games today</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Head to Home to see upcoming matches</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, mi) => {
            const matchBets = bets.filter(b => b.matchId === match.id)
            const myBet = matchBets.find(b => b.userId === userId)
            const open = isBettingOpen(match.kickoffUtc)
            const isFinished = match.status === 'finished'

            return (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mi * 0.06, type: 'spring', stiffness: 300, damping: 26 }}
                onClick={() => setActiveMatch(match)}
                className="w-full text-left rounded-3xl overflow-hidden transition-all active:scale-98"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {/* Match header */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-secondary)' }}>
                      Group {match.group} · MD{match.matchday}
                    </span>
                    <div className="flex items-center gap-2">
                      {match.status === 'live' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />LIVE
                        </span>
                      )}
                      <span className="text-xs font-medium" style={{ color: open ? '#FFD60A' : 'var(--text-secondary)' }}>
                        {isFinished ? 'FT' : formatKickoff(match.kickoffUtc)}
                      </span>
                    </div>
                  </div>

                  {/* Teams + score */}
                  <div className="flex items-center">
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-4xl">{match.homeTeam.flag}</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{match.homeTeam.code}</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      {isFinished || match.status === 'live' ? (
                        <span className="text-4xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {match.homeScore} – {match.awayScore}
                        </span>
                      ) : myBet ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-3xl font-black tabular-nums" style={{ color: '#FFD60A' }}>
                            {myBet.homeScore} – {myBet.awayScore}
                          </span>
                          <span className="text-xs font-medium" style={{ color: open ? '#FFD60A' : 'var(--text-tertiary)' }}>
                            {open ? 'Edit' : 'Locked ✓'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl font-bold" style={{ color: 'var(--text-tertiary)' }}>vs</span>
                          {open && (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full"
                              style={{ backgroundColor: '#FFD60A', color: '#0D0D0F' }}>
                              Predict
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-4xl">{match.awayTeam.flag}</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{match.awayTeam.code}</span>
                    </div>
                  </div>
                </div>

                {/* Predictions strip */}
                <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {STATIC_USERS.map(user => {
                      const bet = matchBets.find(b => b.userId === user.id)
                      const isMe = user.id === userId
                      if (!bet) {
                        return (
                          <div key={user.id} className="flex items-center gap-1.5 opacity-35">
                            <Avatar name={user.name} color={user.color} size="xs" />
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
                          </div>
                        )
                      }
                      return (
                        <div key={user.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: isMe ? 'rgba(255,214,10,0.12)' : 'var(--bg-card-2)',
                            border: isMe ? '1px solid rgba(255,214,10,0.3)' : 'none',
                          }}
                        >
                          <Avatar name={user.name} color={user.color} size="xs" />
                          <span className="text-xs font-bold tabular-nums"
                            style={{ color: isMe ? '#FFD60A' : 'var(--text-primary)' }}>
                            {bet.homeScore}–{bet.awayScore}
                          </span>
                          {isFinished && bet.pointsEarned !== null && (
                            <span className={`text-xs font-bold ${bet.pointsEarned === 10 ? 'text-yellow-400' : bet.pointsEarned >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                              +{bet.pointsEarned}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      <BetSheet
        match={activeMatch}
        bets={bets}
        currentUserId={userId}
        onClose={() => setActiveMatch(null)}
        onBetPlaced={load}
      />
    </div>
  )
}
