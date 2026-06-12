'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { Match, Bet } from '@/types'
import { ScorePicker } from './ScorePicker'
import { formatKickoff, formatMatchDate } from '@/lib/utils'

interface BetSheetProps {
  match: Match | null
  bets: Bet[]
  currentUserId: string | null
  onClose: () => void
  onBetPlaced: () => void
}

export function BetSheet({ match, bets, currentUserId, onClose, onBetPlaced }: BetSheetProps) {
  const existingBet = match ? bets.find(b => b.userId === currentUserId && b.matchId === match.id) : undefined

  useEffect(() => {
    if (!match) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [match])

  const handleBetPlaced = () => {
    onBetPlaced()
    onClose()
  }

  return (
    <AnimatePresence>
      {match && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)' }}
          >
            <div className="max-w-lg mx-auto px-5 pt-4 pb-8">
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'var(--border)' }} />

              {/* Match header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Group {match.group} · MD{match.matchday}
                    {' · '}
                    {formatMatchDate(match.kickoffUtc)} {formatKickoff(match.kickoffUtc)}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{match.homeTeam.flag}</span>
                    <div className="text-center">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{match.homeTeam.code}</p>
                    </div>
                    <span className="text-base font-semibold px-2" style={{ color: 'var(--text-tertiary)' }}>vs</span>
                    <div className="text-center">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{match.awayTeam.code}</p>
                    </div>
                    <span className="text-4xl">{match.awayTeam.flag}</span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    📍 {match.venue}, {match.city}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ml-2 transition-all active:scale-90"
                  style={{ backgroundColor: 'var(--bg-card-2)' }}
                >
                  <X size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* Divider */}
              <div className="mb-4" style={{ borderTop: '1px solid var(--border)' }} />

              {match.status === 'finished' ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Final score</p>
                  <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {match.homeScore} – {match.awayScore}
                  </p>
                </div>
              ) : (
                <ScorePicker
                  match={match}
                  existingBet={existingBet ? { homeScore: existingBet.homeScore, awayScore: existingBet.awayScore } : undefined}
                  onBetPlaced={handleBetPlaced}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
