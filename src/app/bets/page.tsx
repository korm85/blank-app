'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { UserSelector } from '@/components/ui/UserSelector'
import { BetSheet } from '@/components/match/BetSheet'
import { Avatar } from '@/components/ui/Avatar'
import { useUser } from '@/components/providers/UserProvider'
import { usePlayers } from '@/components/providers/PlayersProvider'
import { supabase } from '@/lib/supabase'
import { getUpcomingDaysMatches } from '@/data/schedule'
import { formatKickoff, isBettingOpen } from '@/lib/utils'
import type { Bet, Match } from '@/types'

function resultStyle(pts: number | null) {
  if (pts === null) return { border: 'var(--border)', badge: null }
  if (pts === 10) return { border: 'rgba(255,214,10,0.5)', badge: '🎯', color: '#FFD60A' }
  if (pts >= 7) return { border: 'rgba(48,209,88,0.5)', badge: '+7', color: '#30D158' }
  if (pts >= 3) return { border: 'rgba(48,209,88,0.4)', badge: '+3', color: '#30D158' }
  return { border: 'rgba(255,59,48,0.4)', badge: '✗', color: '#FF3B30' }
}

export default function MatchesPage() {
  const { userId, isLoggedIn } = useUser()
  const { players } = usePlayers()
  const [bets, setBets] = useState<Bet[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  const load = useCallback(async () => {
    const todayMatches = getUpcomingDaysMatches(0)

    try {
      const { data: dbMatches } = await supabase
        .from('matches').select('*').in('id', todayMatches.map(m => m.id))
      if (dbMatches && dbMatches.length > 0) {
        setMatches(todayMatches.map(m => {
          const db = dbMatches.find((d: Record<string, unknown>) => d.id === m.id)
          if (!db) return m
          return { ...m, homeScore: db.home_score ?? null, awayScore: db.away_score ?? null, status: db.status ?? m.status }
        }))
      } else {
        setMatches(todayMatches)
      }
    } catch { setMatches(todayMatches) }

    if (todayMatches.length > 0) {
      try {
        const { data } = await supabase.from('bets').select('*').in('match_id', todayMatches.map(m => m.id))
        if (data) {
          setBets(data.map((b: Record<string, unknown>) => ({
            id: b.id as string, userId: b.user_id as string, matchId: b.match_id as string,
            homeScore: b.home_score as number, awayScore: b.away_score as number,
            pointsEarned: b.points_earned as number | null, createdAt: b.created_at as string,
          })))
        }
      } catch { /* ignore */ }
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
          {[1, 2].map(i => <div key={i} className="h-44 rounded-3xl shimmer" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">🗓</span>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No games today</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Head to Home for upcoming matches</p>
        </div>
      ) : (
        <div className="space-y-5">
          {matches.map((match, mi) => {
            const matchBets = bets.filter(b => b.matchId === match.id)
            const myBet = matchBets.find(b => b.userId === userId)
            const open = isBettingOpen(match.kickoffUtc)
            const isFinished = match.status === 'finished'

            // Find best scorer for this match
            const maxPts = isFinished ? Math.max(...matchBets.map(b => b.pointsEarned ?? 0), 0) : null
            const winners = isFinished && maxPts !== null && maxPts > 0
              ? matchBets.filter(b => b.pointsEarned === maxPts).map(b => b.userId)
              : []

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mi * 0.07, type: 'spring', stiffness: 280, damping: 26 }}
              >
                {/* Match card */}
                <button
                  onClick={() => setActiveMatch(match)}
                  className="w-full text-left rounded-3xl overflow-hidden transition-all active:scale-98 mb-0"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="px-4 pt-4 pb-4">
                    {/* Header row */}
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
                        <span className="text-xs font-medium" style={{ color: open && !isFinished ? '#FFD60A' : 'var(--text-secondary)' }}>
                          {isFinished ? 'Full Time' : formatKickoff(match.kickoffUtc)}
                        </span>
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="flex items-center">
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-4xl">{match.homeTeam.flag}</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{match.homeTeam.code}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center gap-1">
                        {isFinished ? (
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
                            className="flex flex-col items-center"
                          >
                            <span className="text-4xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                              {match.homeScore} – {match.awayScore}
                            </span>
                            <span className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Final</span>
                          </motion.div>
                        ) : myBet ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-3xl font-black tabular-nums" style={{ color: '#FFD60A' }}>
                              {myBet.homeScore} – {myBet.awayScore}
                            </span>
                            <span className="text-xs font-medium" style={{ color: open ? '#FFD60A' : 'var(--text-tertiary)' }}>
                              {open ? 'Tap to edit' : 'Locked ✓'}
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
                    <AnimatePresence>
                      <div className="flex items-center gap-2 flex-wrap">
                        {players.map((player, pi) => {
                          const bet = matchBets.find(b => b.userId === player.id)
                          const isMe = player.id === userId
                          const isWinner = winners.includes(player.id)
                          const { border, badge, color: badgeColor } = resultStyle(bet?.pointsEarned ?? null)

                          if (!bet) {
                            return (
                              <div key={player.id} className="flex items-center gap-1 opacity-30">
                                <Avatar name={player.name} color={player.color} size="xs" />
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
                              </div>
                            )
                          }

                          return (
                            <motion.div
                              key={player.id}
                              initial={isFinished ? { scale: 0.7, opacity: 0 } : false}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={isFinished ? { delay: pi * 0.08, type: 'spring', stiffness: 400, damping: 22 } : undefined}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                              style={{
                                backgroundColor: isMe ? 'rgba(255,214,10,0.1)' : 'var(--bg-card-2)',
                                border: `1.5px solid ${isFinished ? border : isMe ? 'rgba(255,214,10,0.3)' : 'transparent'}`,
                              }}
                            >
                              <Avatar name={player.name} color={player.color} size="xs" />
                              <span className="text-xs font-bold tabular-nums"
                                style={{ color: isMe ? '#FFD60A' : 'var(--text-primary)' }}>
                                {bet.homeScore}–{bet.awayScore}
                              </span>
                              {isFinished && badge && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: pi * 0.08 + 0.15, type: 'spring', stiffness: 500, damping: 20 }}
                                  className="text-xs font-black"
                                  style={{ color: badgeColor }}
                                >
                                  {badge}
                                </motion.span>
                              )}
                              {isWinner && (
                                <motion.span
                                  initial={{ scale: 0, rotate: -20 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: pi * 0.08 + 0.25, type: 'spring' }}
                                >
                                  <Trophy size={11} className="text-yellow-400" />
                                </motion.span>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    </AnimatePresence>
                  </div>
                </button>
              </motion.div>
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
