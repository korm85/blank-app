'use client'

import { motion } from 'framer-motion'
import type { Match, Bet } from '@/types'
import { formatKickoff, isBettingOpen } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: Match
  index?: number
  compact?: boolean
  userBet?: Bet
  onClick?: () => void
}

export function MatchCard({ match, index = 0, compact = false, userBet, onClick }: MatchCardProps) {
  const isOpen = isBettingOpen(match.kickoffUtc)
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const hasBet = !!userBet

  return (
    <motion.button
      initial={false}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl overflow-hidden transition-all active:scale-98',
        compact ? 'p-3' : 'p-4',
        onClick && 'cursor-pointer'
      )}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: hasBet
          ? '1px solid rgba(255,214,10,0.4)'
          : '1px solid var(--border)',
      }}
    >
      {/* Stage / time row */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-secondary)' }}
        >
          Group {match.group} · MD{match.matchday}
        </span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-xs font-bold text-red-400">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {!isFinished && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {formatKickoff(match.kickoffUtc)}
            </span>
          )}
        </div>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl">{match.homeTeam.flag}</span>
          <span className="text-xs font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
            {match.homeTeam.code}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFinished || isLive ? (
            <div className="flex items-center gap-2">
              <span
                className={cn('text-3xl font-black tabular-nums', isLive && 'score-live')}
                style={{ color: 'var(--text-primary)' }}
              >
                {match.homeScore ?? 0}
              </span>
              <span className="text-xl font-bold" style={{ color: 'var(--text-tertiary)' }}>–</span>
              <span
                className={cn('text-3xl font-black tabular-nums', isLive && 'score-live')}
                style={{ color: 'var(--text-primary)' }}
              >
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {hasBet ? (
                <span className="text-base font-bold tabular-nums" style={{ color: '#FFD60A' }}>
                  {userBet!.homeScore} – {userBet!.awayScore}
                </span>
              ) : (
                <span className="text-xl font-bold" style={{ color: 'var(--text-tertiary)' }}>vs</span>
              )}
              {isOpen && !hasBet && (
                <span className="text-xs font-medium text-yellow-400">Tap to bet</span>
              )}
              {hasBet && isOpen && (
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Edit</span>
              )}
              {hasBet && !isOpen && (
                <span className="text-xs text-green-400 font-medium">Locked ✓</span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl">{match.awayTeam.flag}</span>
          <span className="text-xs font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
            {match.awayTeam.code}
          </span>
        </div>
      </div>

      {/* Venue */}
      {!compact && (
        <div className="mt-3 flex items-center justify-center">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            📍 {match.venue}, {match.city}
          </span>
        </div>
      )}
    </motion.button>
  )
}
