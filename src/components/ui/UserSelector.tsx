'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Loader2 } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { usePlayers } from '@/components/providers/PlayersProvider'
import { COLOR_PALETTE } from '@/lib/users'
import { Avatar } from './Avatar'

export function UserSelector() {
  const { setUserId } = useUser()
  const { players, addPlayer } = usePlayers()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[5])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (players.find(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Name already taken')
      return
    }
    setSaving(true)
    setError('')
    try {
      const player = await addPlayer(trimmed, color)
      setUserId(player.id)
    } catch {
      setError('Could not add player. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm py-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Boys For Goals
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Who are you?
          </p>
        </motion.div>

        <div className="space-y-3">
          {players.map((user, i) => (
            <motion.button
              key={user.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => setUserId(user.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-98"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <Avatar name={user.name} color={user.color} size="md" />
              <span className="flex-1 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
            </motion.button>
          ))}

          {/* Add player */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + players.length * 0.05 }}
          >
            <AnimatePresence mode="wait">
              {!adding ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setAdding(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl transition-all active:scale-98"
                  style={{ border: '1.5px dashed var(--border)', color: 'var(--text-secondary)' }}
                >
                  <Plus size={18} />
                  <span className="text-sm font-medium">Add a new player</span>
                </motion.button>
              ) : (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="p-4 rounded-2xl space-y-4"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New player</p>

                  <input
                    autoFocus
                    value={name}
                    onChange={e => { setName(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Name"
                    maxLength={24}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none"
                    style={{
                      backgroundColor: 'var(--bg-card-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />

                  {/* Color picker */}
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-full transition-all active:scale-90"
                        style={{
                          backgroundColor: c,
                          outline: color === c ? `3px solid ${c}` : 'none',
                          outlineOffset: '2px',
                          opacity: color === c ? 1 : 0.55,
                        }}
                      >
                        {color === c && <Check size={14} className="mx-auto" style={{ color: '#fff' }} />}
                      </button>
                    ))}
                  </div>

                  {/* Preview */}
                  {name.trim() && (
                    <div className="flex items-center gap-3">
                      <Avatar name={name.trim()} color={color} size="md" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {name.trim()}
                      </span>
                    </div>
                  )}

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setAdding(false); setName(''); setError('') }}
                      className="flex-1 py-4 rounded-full text-sm font-semibold"
                      style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={!name.trim() || saving}
                      className="flex-1 py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: '#FFD60A', color: '#0D0D0F' }}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
