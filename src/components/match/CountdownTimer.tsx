'use client'

import { useEffect, useState } from 'react'
import { isBettingOpen } from '@/lib/utils'

interface CountdownTimerProps {
  kickoffUtc: string
  onClose?: () => void
}

export function CountdownTimer({ kickoffUtc, onClose }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [phase, setPhase] = useState<'pre' | 'betting' | 'closed'>('pre')

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const kickoff = new Date(kickoffUtc).getTime()
      const cutoff = kickoff + 5 * 60 * 1000
      const diff = kickoff - now

      if (now >= cutoff) {
        setPhase('closed')
        setTimeLeft('Bets closed')
        return
      }

      if (now >= kickoff) {
        setPhase('betting')
        const rem = Math.max(0, cutoff - now)
        const m = Math.floor(rem / 60000)
        const s = Math.floor((rem % 60000) / 1000)
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')} left`)
        return
      }

      setPhase('pre')
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)

      if (days > 0) setTimeLeft(`${days}d ${hours}h`)
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`)
      else setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [kickoffUtc, onClose])

  const color = phase === 'closed' ? '#FF453A' : phase === 'betting' ? '#FFD60A' : '#30D158'
  const label = phase === 'betting' ? '🔥 LIVE — BET NOW' : phase === 'closed' ? 'Bets Closed' : 'Kickoff in'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
      {phase !== 'closed' && (
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {timeLeft}
        </span>
      )}
    </div>
  )
}
