'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Delete } from 'lucide-react'
import type { Match } from '@/types'
import { useUser } from '@/components/providers/UserProvider'
import { supabase } from '@/lib/supabase'
import { isBettingOpen } from '@/lib/utils'

interface ScorePickerProps {
  match: Match
  existingBet?: { homeScore: number; awayScore: number }
  onBetPlaced?: () => void
}

export function ScorePicker({ match, existingBet, onBetPlaced }: ScorePickerProps) {
  const { userId, isLoggedIn } = useUser()
  const [home, setHome] = useState(existingBet?.homeScore ?? 0)
  const [away, setAway] = useState(existingBet?.awayScore ?? 0)
  const [active, setActive] = useState<'home' | 'away'>('home')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(!!existingBet)
  const [error, setError] = useState('')
  const open = isBettingOpen(match.kickoffUtc)

  const press = (d: number) => {
    setSaved(false)
    if (active === 'home') setHome(v => v === 0 ? d : Math.min(99, Number(`${v}${d}`)))
    else setAway(v => v === 0 ? d : Math.min(99, Number(`${v}${d}`)))
  }

  const del = () => {
    setSaved(false)
    if (active === 'home') setHome(v => Math.floor(v / 10))
    else setAway(v => Math.floor(v / 10))
  }

  const submit = async () => {
    if (!userId || !open) return
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.from('bets').upsert(
        { user_id: userId, match_id: match.id, home_score: home, away_score: away },
        { onConflict: 'user_id,match_id' }
      )
      if (err) throw err
      setSaved(true)
      onBetPlaced?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save bet')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) return null

  const ScoreBox = ({ side }: { side: 'home' | 'away' }) => {
    const isActive = active === side && open
    const score = side === 'home' ? home : away
    const t = side === 'home' ? match.homeTeam : match.awayTeam
    return (
      <button
        onClick={() => open && setActive(side)}
        className="flex-1 flex flex-col items-center gap-2 py-5 rounded-3xl transition-all active:scale-95"
        style={{
          backgroundColor: isActive ? 'rgba(255,214,10,0.08)' : 'var(--bg-card-2)',
          border: `2px solid ${isActive ? '#FFD60A' : 'transparent'}`,
        }}
      >
        <span className="text-3xl">{t.flag}</span>
        <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {t.code}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={score}
            initial={{ scale: 1.35, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="text-6xl font-black tabular-nums leading-none"
            style={{ color: isActive ? '#FFD60A' : 'var(--text-primary)' }}
          >
            {score}
          </motion.span>
        </AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-medium text-yellow-400"
          >
            editing
          </motion.span>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Score panels */}
      <div className="flex items-center gap-3">
        <ScoreBox side="home" />
        <span className="text-3xl font-black" style={{ color: 'var(--text-tertiary)' }}>–</span>
        <ScoreBox side="away" />
      </div>

      {open ? (
        <>
          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2.5">
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(d => (
              <motion.button
                key={d}
                whileTap={{ scale: 0.9 }}
                onClick={() => press(d)}
                className="h-16 rounded-2xl text-2xl font-semibold"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                {d}
              </motion.button>
            ))}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={del}
              className="h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
            >
              <Delete size={22} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => press(0)}
              className="h-16 rounded-2xl text-2xl font-semibold"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              0
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={submit}
              disabled={loading || saved}
              className="h-16 rounded-2xl text-base font-bold transition-all disabled:opacity-60"
              style={{
                backgroundColor: saved ? 'rgba(48,209,88,0.15)' : '#FFD60A',
                color: saved ? '#30D158' : '#0D0D0F',
                border: saved ? '1.5px solid #30D158' : 'none',
              }}
            >
              {loading ? '…' : saved ? '✓ Saved' : 'Save'}
            </motion.button>
          </div>
          {error && <p className="text-center text-xs text-red-400">{error}</p>}
          {saved && <p className="text-center text-xs text-green-400 font-medium">Bet saved ✓</p>}
        </>
      ) : (
        <div className="py-4 text-center text-sm font-medium rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
          Betting closed
        </div>
      )}
    </div>
  )
}
