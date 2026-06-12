'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Target, Check, X, CheckCircle2 } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { usePlayers } from '@/components/providers/PlayersProvider'
import { Avatar } from '@/components/ui/Avatar'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'
import { supabase } from '@/lib/supabase'
import { saveFavoriteTeam } from '@/lib/favorites'
import { isBettingOpen } from '@/lib/utils'
import type { Match } from '@/types'

const DONE_KEY = (id: string) => `bfg_onboarding_${id}`

// ── Mini inline bet picker ──────────────────────────────────────────────────
function MiniBet({ match, userId }: { match: Match; userId: string }) {
  const [home, setHome] = useState(0)
  const [away, setAway] = useState(0)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('bets').upsert(
      { user_id: userId, match_id: match.id, home_score: home, away_score: away },
      { onConflict: 'user_id,match_id' }
    )
    setSaving(false)
    setSaved(true)
  }

  const Stepper = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => { onChange(Math.max(0, value - 1)); setSaved(false) }}
        className="w-11 h-11 rounded-full text-xl font-bold flex items-center justify-center active:scale-90 transition-transform"
        style={{ backgroundColor: 'rgba(255,23,68,0.18)', color: '#FF1744', border: '2px solid rgba(255,23,68,0.4)' }}
      >−</button>
      <span className="text-3xl font-black tabular-nums w-8 text-center" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
      <button
        onClick={() => { onChange(value + 1); setSaved(false) }}
        className="w-11 h-11 rounded-full text-xl font-bold flex items-center justify-center active:scale-90 transition-transform"
        style={{ backgroundColor: 'rgba(0,230,118,0.18)', color: '#00E676', border: '2px solid rgba(0,230,118,0.4)' }}
      >+</button>
    </div>
  )

  const kickoffStr = new Date(match.kickoffUtc).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC'

  return (
    <div className="p-3 rounded-2xl space-y-3" style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border)' }}>
      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>{kickoffStr}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-1 w-14">
          <span className="text-2xl">{match.homeTeam.flag}</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{match.homeTeam.code}</span>
        </div>
        <Stepper value={home} onChange={setHome} />
        <span className="text-base font-black" style={{ color: 'var(--text-tertiary)' }}>–</span>
        <Stepper value={away} onChange={setAway} />
        <div className="flex flex-col items-center gap-1 w-14">
          <span className="text-2xl">{match.awayTeam.flag}</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{match.awayTeam.code}</span>
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-97"
        style={{
          backgroundColor: saved ? 'rgba(0,230,118,0.18)' : '#FFD60A',
          color: saved ? '#00E676' : '#0A0B12',
          border: saved ? '2px solid rgba(0,230,118,0.5)' : '2px solid transparent',
        }}
      >
        {saved ? <><Check size={14} /> Bet saved!</> : saving ? '…' : 'Save bet'}
      </button>
    </div>
  )
}

// ── Main overlay ────────────────────────────────────────────────────────────
export function OnboardingOverlay() {
  const { userId, setUserId } = useUser()
  const { players } = usePlayers()
  const user = players.find(p => p.id === userId)

  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [initialStep, setInitialStep] = useState(0)
  const [favCode, setFavCode] = useState('')
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())
  const [pickingId, setPickingId] = useState<string | null>(null)

  // Load claimed players from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('users').select('id, claimed')
        if (data) {
          setClaimedIds(new Set(
            data
              .filter((u: Record<string, unknown>) => u.claimed)
              .map((u: Record<string, unknown>) => u.id as string)
          ))
        }
      } catch { /* graceful: no claimed column yet, treat all as available */ }
    }
    load()
  }, [])

  // Determine visibility on mount — check localStorage directly to avoid race with UserProvider
  useEffect(() => {
    const storedId = localStorage.getItem('bfg_user_id')
    if (!storedId) {
      setInitialStep(0)
      setStep(0)
      setVisible(true)
    } else if (!localStorage.getItem(DONE_KEY(storedId))) {
      setInitialStep(1)
      setStep(1)
      setVisible(true)
    }
  }, [])

  const allTeams = useMemo(() => {
    const map = new Map<string, { name: string; code: string; flag: string }>()
    for (const m of GROUP_STAGE_MATCHES) {
      map.set(m.homeTeam.code, m.homeTeam)
      map.set(m.awayTeam.code, m.awayTeam)
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const upcomingMatches = useMemo(() =>
    GROUP_STAGE_MATCHES.filter(m => isBettingOpen(m.kickoffUtc)).slice(0, 3)
  , [])

  const finish = () => {
    const id = userId ?? localStorage.getItem('bfg_user_id')
    if (id) localStorage.setItem(DONE_KEY(id), '1')
    setVisible(false)
  }

  const handlePickPlayer = async (playerId: string) => {
    if (pickingId || claimedIds.has(playerId)) return
    setPickingId(playerId)
    try {
      await supabase.from('users').update({ claimed: true }).eq('id', playerId)
    } catch { /* ignore — still proceed locally */ }
    setUserId(playerId)
    setClaimedIds(prev => new Set([...prev, playerId]))
    setPickingId(null)
    setStep(1)
  }

  const handleFavPick = (code: string) => {
    setFavCode(code)
    const id = userId
    if (id) {
      saveFavoriteTeam(id, code, (c) => {
        supabase.from('users').update({ favorite_team: c }).eq('id', id).then(() => {})
      })
    }
  }

  const totalSteps = initialStep === 0 ? 4 : 3
  const progressCurrent = step - initialStep

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              maxHeight: '88vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{
                      width: i === progressCurrent ? 20 : 6, height: 6,
                      backgroundColor: i <= progressCurrent ? '#FFD60A' : 'var(--border)',
                    }} />
                ))}
              </div>
              {step > 0 && (
                <button onClick={finish} className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-tertiary)' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <AnimatePresence mode="wait">

                {/* ── Step 0: Who are you? ── */}
                {step === 0 && (
                  <motion.div key="s0"
                    initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">👋</div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Who are you?
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Pick your name — once claimed, it's yours.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {players.map(p => {
                        const isClaimed = claimedIds.has(p.id)
                        const isLoading = pickingId === p.id
                        return (
                          <button
                            key={p.id}
                            onClick={() => handlePickPlayer(p.id)}
                            disabled={isClaimed || !!pickingId}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              border: `2px solid ${isClaimed ? 'transparent' : 'var(--border)'}`,
                              opacity: isClaimed ? 0.45 : 1,
                              cursor: isClaimed ? 'default' : 'pointer',
                            }}
                          >
                            <Avatar name={p.name} color={p.color} avatarUrl={p.avatarUrl} size="md" />
                            <span className="flex-1 text-left text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {p.name}
                            </span>
                            {isClaimed ? (
                              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-tertiary)' }}>
                                <CheckCircle2 size={12} /> Taken
                              </span>
                            ) : isLoading ? (
                              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>…</span>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                                style={{ borderColor: p.color }} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 1: Pick your team ── */}
                {step === 1 && (
                  <motion.div key="s1"
                    initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">🏆</div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Welcome{user ? `, ${user.name}` : ''}!
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Which team are you rooting for?
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {allTeams.map(t => (
                        <button
                          key={t.code}
                          onClick={() => handleFavPick(t.code)}
                          className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all active:scale-95"
                          style={{
                            width: 58,
                            backgroundColor: favCode === t.code ? 'rgba(255,214,10,0.15)' : 'var(--bg-card)',
                            border: `2px solid ${favCode === t.code ? '#FFD60A' : 'transparent'}`,
                          }}
                        >
                          <span className="text-xl leading-none">{t.flag}</span>
                          <span className="text-[10px] font-bold" style={{ color: favCode === t.code ? '#FFD60A' : 'var(--text-secondary)' }}>
                            {t.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Place first bets ── */}
                {step === 2 && (
                  <motion.div key="s2"
                    initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">⚽</div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Place your first bet!
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Predict the score — bets lock at kickoff.
                      </p>
                    </div>
                    {upcomingMatches.length > 0 ? (
                      upcomingMatches.map(m => (
                        <MiniBet key={m.id} match={m} userId={userId!} />
                      ))
                    ) : (
                      <p className="text-center text-sm py-6" style={{ color: 'var(--text-secondary)' }}>
                        No upcoming matches open for betting right now.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* ── Step 3: How scoring works ── */}
                {step === 3 && (
                  <motion.div key="s3"
                    initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="text-center">
                      <div className="mb-3"><Target size={40} className="mx-auto text-yellow-400" /></div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>How scoring works</h2>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        The sharper your prediction, the more points you earn.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { icon: '🎯', label: 'Exact score', pts: '10 pts', color: '#FFD60A' },
                        { icon: '✅', label: 'Right result + goal diff', pts: '7 pts', color: '#30D158' },
                        { icon: '✓', label: 'Right result', pts: '3 pts', color: '#45B7D1' },
                        { icon: '✗', label: 'Wrong', pts: '0 pts', color: 'var(--text-tertiary)' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between px-4 py-3 rounded-2xl"
                          style={{ backgroundColor: 'var(--bg-card)' }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{row.icon}</span>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.label}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: row.color }}>{row.pts}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer — only shown from step 1 onwards */}
            {step > 0 && (
              <div className="px-5 pb-6 pt-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => {
                    if (step < 3) setStep(s => s + 1)
                    else finish()
                  }}
                  disabled={step === 1 && !favCode}
                  className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-1 transition-all active:scale-97 disabled:opacity-40"
                  style={{ backgroundColor: '#FFD60A', color: '#0D0D0F' }}
                >
                  {step === 1 && !favCode ? 'Pick a team to continue'
                    : step < 3 ? <><span>Next</span><ChevronRight size={16} /></>
                    : "Let's go! ⚽"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
