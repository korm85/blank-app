'use client'

import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '@/types'
import { Avatar } from '@/components/ui/Avatar'

interface LeaderRowProps {
  entry: LeaderboardEntry
  index: number
  isCurrentUser?: boolean
}

const RANK_COLORS = ['#FFD60A', '#C0C0C0', '#CD7F32']
const RANK_EMOJIS = ['🥇', '🥈', '🥉']

export function LeaderRow({ entry, index, isCurrentUser }: LeaderRowProps) {
  const { user, totalPoints, totalBets, exactScores, rank } = entry
  const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : 'var(--text-tertiary)'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
      className="flex items-center gap-3 p-4 rounded-2xl"
      style={{
        backgroundColor: isCurrentUser ? `${user.color}11` : 'var(--bg-card)',
        border: isCurrentUser ? `1px solid ${user.color}44` : '1px solid var(--border)',
      }}
    >
      {/* Rank */}
      <div className="w-8 flex-shrink-0 text-center">
        {rank <= 3 ? (
          <span className="text-lg">{RANK_EMOJIS[rank - 1]}</span>
        ) : (
          <span className="text-sm font-bold tabular-nums" style={{ color: rankColor }}>
            {rank}
          </span>
        )}
      </div>

      <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
          {isCurrentUser && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${user.color}22`, color: user.color }}>
              You
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-0.5">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {totalBets} bets
          </span>
          {exactScores > 0 && (
            <span className="text-xs text-green-400">
              🎯 {exactScores} exact
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <div className="text-xl font-black tabular-nums" style={{ color: rankColor }}>
          {totalPoints}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>pts</div>
      </div>
    </motion.div>
  )
}
