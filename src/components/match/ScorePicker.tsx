'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
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
  const [home, setHome] = useState(existingBet?.homeScore ?? 1)
  const [away, setAway] = useState(existingBet?.awayScore ?? 1)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(!!existingBet)
  const [error, setError] = useState('')

  const open = isBettingOpen(match.kickoffUtc)

  const adjust = (side: 'home' | 'away', delta: number) => {
    if (!open) return
    setSaved(false)
    if (side === 'home') setHome(v => Math.max(0, Math.min(20, v + delta)))
    else setAway(v => Math.max(0, Math.min(20, v + delta)))
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

  const ScoreControl = ({ value, onChange, label }: { value: number; onChange: (d: number) => void; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <button
        onClick={() => onChange(1)}
        disabled={!open}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
        style={{ backgroundColor: 'var(--bg-card-2)' }}
      >
        <ChevronUp size={20} style={{ color: 'var(--text-primary)' }} />
      </button>
      <motion.span
        key={value}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl font-bold tabular-nums w-14 text-center"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </motion.span>
      <button
        onClick={() => onChange(-1)}
        disabled={!open || value === 0}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
        style={{ backgroundColor: 'var(--bg-card-2)' }}
      >
        <ChevronDown size={20} style={{ color: 'var(--text-primary)' }} />
      </button>
    </div>
  )

  if (!isLoggedIn) return null

  return (
    <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-center gap-6 mb-5">
        <ScoreControl value={home} onChange={d => adjust('home', d)} label={match.homeTeam.code} />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)' }}>—</span>
          {saved && <span className="text-xs text-green-400 font-medium">Saved ✓</span>}
        </div>
        <ScoreControl value={away} onChange={d => adjust('away', d)} label={match.awayTeam.code} />
      </div>

      {error && <p className="text-center text-xs text-red-400 mb-3">{error}</p>}

      {open ? (
        <button
          onClick={submit}
          disabled={loading || saved}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-98 disabled:opacity-50"
          style={{
            backgroundColor: saved ? 'var(--bg-card-2)' : '#FFD60A',
            color: saved ? 'var(--text-secondary)' : '#0D0D0F',
          }}
        >
          {loading ? 'Saving...' : saved ? `Bet saved: ${home} – ${away}` : 'Place Bet'}
        </button>
      ) : (
        <div className="w-full py-3 rounded-xl text-center text-sm font-medium" style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-secondary)' }}>
          Betting is closed
        </div>
      )}
    </div>
  )
}
