'use client'

import { useEffect } from 'react'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'

// Registers service worker and fires a browser notification when a match is < 2h away.
// Called on every page load — the `tag` field deduplicates within the same match.
export function MatchNotifier() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Register sw
    navigator.serviceWorker.register('/sw.js').catch(() => {})

    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const now = Date.now()
    const soon = GROUP_STAGE_MATCHES.filter(m => {
      const kick = new Date(m.kickoffUtc).getTime()
      const mins = (kick - now) / 60_000
      return mins > 0 && mins <= 90
    })

    soon.forEach(m => {
      const mins = Math.round((new Date(m.kickoffUtc).getTime() - now) / 60_000)
      new Notification('Boys For Goals ⚽', {
        body: `${m.homeTeam.flag} ${m.homeTeam.code} vs ${m.awayTeam.code} ${m.awayTeam.flag} — ${mins} min to kickoff! Bet is closing.`,
        icon: '/icon-192.png',
        tag: `bfg-${m.id}`,
      })
    })
  }, [])

  return null
}
