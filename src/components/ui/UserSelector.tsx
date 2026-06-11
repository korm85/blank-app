'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { STATIC_USERS } from '@/lib/users'
import { useUser } from '@/components/providers/UserProvider'
import { Avatar } from './Avatar'

export function UserSelector() {
  const { setUserId } = useUser()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm">
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
          {STATIC_USERS.map((user, i) => (
            <motion.button
              key={user.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => setUserId(user.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-98"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <Avatar name={user.name} color={user.color} size="md" />
              <div className="flex-1 text-left">
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: user.color }}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
