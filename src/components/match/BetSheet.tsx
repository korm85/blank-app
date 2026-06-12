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
  const existingBet = match
    ? bets.find(b => b.userId === currentUserId && b.matchId === match.id)
    : undefined

  useEffect(() => {
    if (!match) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [match])

  return (
    <AnimatePresence>
      {match && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 440, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-3xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)' }}
          >
            <div className="max-w-lg mx-auto px-4 pt-3" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--border)' }} />

              {/* Match meta row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Group {match.group} · MD{match.matchday}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {formatMatchDate(match.kickoffUtc)} · {formatKickoff(match.kickoffUtc)} · {match.city}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ backgroundColor: 'var(--bg-card-2)' }}
                >
                  <X size={15} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {match.status === 'finished' ? (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Final</p>
                  <p className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {match.homeScore} – {match.awayScore}
                  </p>
                </div>
              ) : (
                <ScorePicker
                  match={match}
                  existingBet={existingBet ? { homeScore: existingBet.homeScore, awayScore: existingBet.awayScore } : undefined}
                  onBetPlaced={() => { onBetPlaced(); onClose() }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
