'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { LeaderRow } from '@/components/leaderboard/LeaderRow'
import { supabase } from '@/lib/supabase'
import { STATIC_USERS } from '@/lib/users'
import type { LeaderboardEntry } from '@/types'

export default function LeaderboardPage() {
  const { userId, isLoggedIn } = useUser()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data: bets } = await supabase
        .from('bets')
        .select('user_id, points_earned, home_score, away_score, match_id')

      const entryMap = new Map<string, LeaderboardEntry>()

      STATIC_USERS.forEach((user, i) => {
        entryMap.set(user.id, {
          user: { ...user, createdAt: '' },
          totalPoints: 0,
          totalBets: 0,
          exactScores: 0,
          correctResults: 0,
          rank: i + 1,
        })
      })

      if (bets) {
        bets.forEach((b: Record<string, unknown>) => {
          const entry = entryMap.get(b.user_id as string)
          if (!entry) return
          entry.totalBets++
          if (b.points_earned !== null && b.points_earned !== undefined) {
            const pts = b.points_earned as number
            entry.totalPoints += pts
            if (pts === 10) entry.exactScores++
            if (pts >= 3) entry.correctResults++
          }
        })
      }

      const sorted = Array.from(entryMap.values())
        .sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores)
        .map((e, i) => ({ ...e, rank: i + 1 }))

      setEntries(sorted)
    } catch {
      // Supabase not connected — show zeroed leaderboard
      const zeroed = STATIC_USERS.map((user, i) => ({
        user: { ...user, createdAt: '' },
        totalPoints: 0,
        totalBets: 0,
        exactScores: 0,
        correctResults: 0,
        rank: i + 1,
      }))
      setEntries(zeroed)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (!isLoggedIn) return <UserSelector />

  const leader = entries[0]

  return (
    <div className="min-h-dvh px-4 py-4">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Leaderboard
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        World Cup 2026
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-2xl shimmer" />
          ))}
        </div>
      ) : (
        <>
          {leader && leader.totalPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-5 rounded-3xl text-center"
              style={{
                background: `linear-gradient(135deg, ${leader.user.color}22 0%, ${leader.user.color}11 100%)`,
                border: `1px solid ${leader.user.color}44`,
              }}
            >
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {leader.user.name} is leading!
              </div>
              <div className="text-3xl font-black mt-1" style={{ color: leader.user.color }}>
                {leader.totalPoints} pts
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            {entries.map((entry, i) => (
              <LeaderRow
                key={entry.user.id}
                entry={entry}
                index={i}
                isCurrentUser={entry.user.id === userId}
              />
            ))}
          </div>

          {entries.every(e => e.totalBets === 0) && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No bets placed yet. Get betting on Today&apos;s games!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
