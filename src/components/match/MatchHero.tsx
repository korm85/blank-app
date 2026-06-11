'use client'

import { motion } from 'framer-motion'
import type { Match, Bet } from '@/types'
import { CountdownTimer } from './CountdownTimer'
import { ScorePicker } from './ScorePicker'
import { Avatar } from '@/components/ui/Avatar'
import { STATIC_USERS } from '@/lib/users'

interface MatchHeroProps {
  match: Match
  bets: Bet[]
  currentUserId: string | null
  onBetPlaced?: () => void
}

export function MatchHero({ match, bets, currentUserId, onBetPlaced }: MatchHeroProps) {
  const myBet = bets.find(b => b.userId === currentUserId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
      className="mx-4 rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #1C1C1E 0%, #2C2C2E 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,214,10,0.15)', color: '#FFD60A' }}
          >
            Group {match.group}
          </span>
          <CountdownTimer kickoffUtc={match.kickoffUtc} />
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-5xl">{match.homeTeam.flag}</span>
            <span className="text-sm font-bold text-center text-white">{match.homeTeam.name}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            {match.status === 'finished' || match.status === 'live' ? (
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-white tabular-nums">{match.homeScore}</span>
                <span className="text-2xl text-gray-500">–</span>
                <span className="text-4xl font-black text-white tabular-nums">{match.awayScore}</span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-500">vs</span>
            )}
            <span className="text-xs text-gray-500">{match.venue}</span>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-5xl">{match.awayTeam.flag}</span>
            <span className="text-sm font-bold text-center text-white">{match.awayTeam.name}</span>
          </div>
        </div>
      </div>

      {/* Who has bet */}
      <div className="px-6 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs mr-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Bets in:</span>
        {STATIC_USERS.map(user => {
          const bet = bets.find(b => b.userId === user.id)
          return (
            <div key={user.id} className="relative">
              <Avatar
                name={user.name}
                color={user.color}
                avatarUrl={user.avatarUrl}
                size="xs"
                className={bet ? 'opacity-100' : 'opacity-20'}
              />
              {bet && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-black"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Bet form */}
      <div className="px-6 pb-6 pt-2">
        <ScorePicker
          match={match}
          existingBet={myBet ? { homeScore: myBet.homeScore, awayScore: myBet.awayScore } : undefined}
          onBetPlaced={onBetPlaced}
        />
      </div>
    </motion.div>
  )
}
