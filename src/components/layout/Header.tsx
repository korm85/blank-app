'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Trophy } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { Avatar } from '@/components/ui/Avatar'
import { getUserById } from '@/lib/users'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { userId } = useUser()
  const user = userId ? getUserById(userId) : null

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 glass safe-top"
      style={{ backgroundColor: 'var(--bottom-nav-bg)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Boys For Goals
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: 'var(--bg-card-2)' }}
          >
            {theme === 'dark'
              ? <Sun size={16} style={{ color: 'var(--text-secondary)' }} />
              : <Moon size={16} style={{ color: 'var(--text-secondary)' }} />
            }
          </button>

          {user && (
            <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} size="sm" />
          )}
        </div>
      </div>
    </header>
  )
}
