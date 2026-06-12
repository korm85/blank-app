'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageCircle, Save, Check, LogOut, Bell, BellOff } from 'lucide-react'
import { UserSelector } from '@/components/ui/UserSelector'
import { useUser } from '@/components/providers/UserProvider'
import { usePlayers } from '@/components/providers/PlayersProvider'
import { Avatar } from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { GROUP_STAGE_MATCHES } from '@/data/schedule'
import type { Bet } from '@/types'

const NOTIF_KEY = (id: string) => `bfg_notif_${id}`

export default function ProfilePage() {
  const { userId, isLoggedIn, setUserId } = useUser()
  const { players, refreshPlayers } = usePlayers()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notifSaved, setNotifSaved] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [testEmailState, setTestEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const user = players.find(p => p.id === userId)

  const load = useCallback(async () => {
    if (!userId) return
    // Load notification prefs from localStorage
    const stored = JSON.parse(localStorage.getItem(NOTIF_KEY(userId)) || '{}')
    setEmail(stored.email || '')
    setPhone(stored.phone || '')

    try {
      const { data } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (data) {
        setBets(data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          userId: b.user_id as string,
          matchId: b.match_id as string,
          homeScore: b.home_score as number,
          awayScore: b.away_score as number,
          pointsEarned: b.points_earned as number | null,
          createdAt: b.created_at as string,
        })))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) { setPushPermission('unsupported'); return }
    setPushPermission(Notification.permission)
    navigator.serviceWorker?.register('/sw.js').catch(() => {})
  }, [])

  const enablePush = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setPushPermission(perm)
    if (perm === 'granted') {
      new Notification('Boys For Goals ⚽', {
        body: "You're set! We'll remind you when a match is about to kick off.",
        icon: '/icon-192.png',
        tag: 'bfg-test',
      })
    }
  }

  const sendTestEmail = async () => {
    if (!email.trim()) return
    setTestEmailState('sending')
    try {
      const res = await fetch(`/api/notify?test=1&email=${encodeURIComponent(email.trim())}`)
      setTestEmailState(res.ok ? 'sent' : 'error')
    } catch {
      setTestEmailState('error')
    }
    setTimeout(() => setTestEmailState('idle'), 3000)
  }

  const saveNotifications = () => {
    if (!userId) return
    localStorage.setItem(NOTIF_KEY(userId), JSON.stringify({ email: email.trim(), phone: phone.trim() }))
    // Best-effort DB sync (requires email/phone columns to exist)
    supabase.from('users').update({ email: email.trim() || null, phone: phone.trim() || null }).eq('id', userId).then(() => {})
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2500)
  }

  if (!isLoggedIn) return <UserSelector />
  if (!user) return null

  const gradedBets = bets.filter(b => b.pointsEarned !== null)
  const totalPoints = gradedBets.reduce((sum, b) => sum + (b.pointsEarned ?? 0), 0)
  const exactScores = gradedBets.filter(b => b.pointsEarned === 10).length
  const correctResults = gradedBets.filter(b => (b.pointsEarned ?? 0) >= 3).length

  const statCards = [
    { label: 'Total Points', value: totalPoints, color: user.color },
    { label: 'Bets Placed', value: bets.length, color: '#45B7D1' },
    { label: 'Exact Scores 🎯', value: exactScores, color: '#30D158' },
    { label: 'Correct Results', value: correctResults, color: '#FF9F0A' },
  ]

  const otherPlayers = players.filter(p => p.id !== userId)

  return (
    <div className="min-h-dvh px-4 py-4" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Profile header */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-8 mb-6 rounded-3xl"
        style={{
          background: `linear-gradient(135deg, ${user.color}18 0%, ${user.color}08 100%)`,
          border: `1px solid ${user.color}30`,
        }}
      >
        <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} size="xl" />
        <h2 className="text-2xl font-bold mt-4 mb-1" style={{ color: 'var(--text-primary)' }}>
          {user.name}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>World Cup 2026</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0 }}
            className="p-4 rounded-2xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl font-black tabular-nums mb-1" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Notifications */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0 }}
        className="mb-6 p-4 rounded-3xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Notifications
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-card-2)' }}>
              <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email for reminders (optional)"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-card-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-card-2)' }}>
              <MessageCircle size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1234567890 for WhatsApp"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-card-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
          Reminders 1–2 hours before kickoff when betting is still open.
        </p>

        {/* Save contact info */}
        <button
          onClick={saveNotifications}
          className="w-full py-4 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 mb-3"
          style={{ backgroundColor: notifSaved ? '#30D158' : '#FFD60A', color: '#0D0D0F' }}
        >
          {notifSaved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save notifications</>}
        </button>

        {/* Browser push notifications */}
        <button
          onClick={pushPermission === 'granted' ? undefined : enablePush}
          disabled={pushPermission === 'unsupported' || pushPermission === 'denied'}
          className="w-full py-4 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 mb-3 disabled:opacity-40"
          style={{
            backgroundColor: pushPermission === 'granted' ? 'rgba(48,209,88,0.15)' : 'var(--bg-card-2)',
            border: `1.5px solid ${pushPermission === 'granted' ? '#30D158' : 'var(--border)'}`,
            color: pushPermission === 'granted' ? '#30D158' : 'var(--text-primary)',
          }}
        >
          {pushPermission === 'granted'
            ? <><Bell size={16} /> Push notifications on</>
            : pushPermission === 'denied'
            ? <><BellOff size={16} /> Blocked — enable in phone settings</>
            : pushPermission === 'unsupported'
            ? <><BellOff size={16} /> Notifications not supported</>
            : <><Bell size={16} /> Enable push notifications</>}
        </button>

        {/* Test email (only shown when email is saved) */}
        {email.trim() && (
          <button
            onClick={sendTestEmail}
            disabled={testEmailState === 'sending'}
            className="w-full py-4 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}
          >
            {testEmailState === 'sending' ? '…Sending'
              : testEmailState === 'sent' ? '✅ Test email sent!'
              : testEmailState === 'error' ? '⚠️ Email not configured yet'
              : <><Mail size={14} /> Send test email</>}
          </button>
        )}

      </motion.div>

      {/* Switch player */}
      {otherPlayers.length > 0 && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0 }}
          className="mb-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
            Switch Player
          </p>
          <div className="space-y-2">
            {otherPlayers.map((u, i) => (
              <motion.button
                key={u.id}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0 }}
                onClick={() => setUserId(u.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <Avatar name={u.name} color={u.color} size="sm" />
                <span className="text-sm font-medium flex-1 text-left" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sign out */}
      <motion.button
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0 }}
        onClick={() => { localStorage.removeItem('bfg_user_id'); setUserId('') }}
        className="w-full py-4 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mb-8"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}
      >
        <LogOut size={15} />
        Sign out
      </motion.button>
    </div>
  )
}
