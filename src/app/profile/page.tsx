'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { Avatar } from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { STATIC_USERS, getUserById } from '@/lib/users'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'
import { getBetResultLabel } from '@/lib/scoring'
import type { Bet, BetResult } from '@/types'
import { LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { userId, isLoggedIn, setUserId } = useUser()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

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
    } catch { /* ignore */ }
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  if (!isLoggedIn) return <UserSelector />

  const user = getUserById(userId!)
  if (!user) return null

  const gradedBets = bets.filter(b => b.pointsEarned !== null)
  const totalPoints = gradedBets.reduce((sum, b) => sum + (b.pointsEarned ?? 0), 0)
  const exactScores = gradedBets.filter(b => b.pointsEarned === 10).length
  const correctResults = gradedBets.filter(b => (b.pointsEarned ?? 0) >= 3).length

  const statCards = [
    { label: 'Total Points', value: totalPoints, color: user.color },
    { label: 'Bets Placed', value: bets.length, color: '#45B7D1' },
    { label: 'Exact Scores 🎯', value: exactScores, color: '#30D158' },
    { label: 'Correct Results', value: correctResults, color: '#FF9F0A' },
  ]

  return (
    <div className="min-h-dvh px-4 py-4">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-8 mb-6 rounded-3xl"
        style={{
          background: `linear-gradient(135deg, ${user.color}18 0%, ${user.color}08 100%)`,
          border: `1px solid ${user.color}30`,
        }}
      >
        <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} size="xl" />
        <h2 className="text-2xl font-bold mt-4 mb-1" style={{ color: 'var(--text-primary)' }}>
          {user.name}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          World Cup 2026
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="p-4 rounded-2xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl font-black tabular-nums mb-1" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Switch user */}
      <div className="space-y-2 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
          Switch Player
        </p>
        {STATIC_USERS.filter(u => u.id !== userId).map((u, i) => (
          <motion.button
            key={u.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => setUserId(u.id)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Avatar name={u.name} color={u.color} size="sm" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
