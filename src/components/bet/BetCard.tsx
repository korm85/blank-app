'use client'

import { motion } from 'framer-motion'
import type { Bet, Match } from '@/types'
import { getUserById } from '@/lib/users'
import { Avatar } from '@/components/ui/Avatar'
import { getBetResultColor, getBetResultLabel } from '@/lib/scoring'
import type { BetResult } from '@/types'

interface BetCardProps {
  bet: Bet
  match: Match
  index?: number
}

export function BetCard({ bet, match, index = 0 }: BetCardProps) {
  const user = getUserById(bet.userId)
  if (!user) return null

  let result: BetResult = 'pending'
  if (match.status === 'finished' && match.homeScore !== null && match.awayScore !== null) {
    if (bet.pointsEarned === 10) result = 'exact'
    else if (bet.pointsEarned === 7) result = 'correct_result_diff'
    else if (bet.pointsEarned === 3) result = 'correct_result'
    else if (bet.pointsEarned === 0) result = 'wrong'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} size="sm" />

      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {user.name}
        </span>
      </div>

      {/* Predicted score */}
      <div className="flex items-center gap-1">
        <span className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {bet.homeScore}
        </span>
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>–</span>
        <span className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {bet.awayScore}
        </span>
      </div>

      {/* Result badge */}
      {result !== 'pending' && (
        <div className="flex items-center gap-1">
          <span className={`text-xs font-bold ${getBetResultColor(result)}`}>
            {bet.pointsEarned}pts
          </span>
        </div>
      )}
      {result === 'pending' && (
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>pending</span>
      )}
    </motion.div>
  )
}
