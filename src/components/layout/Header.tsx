'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { Avatar } from '@/components/ui/Avatar'
import { getUserById } from '@/lib/users'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { userId } = useUser()
  const user = userId ? getUserById(userId) : null
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 60)
      setLastY(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastY])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 safe-top transition-transform duration-300"
      style={{
        backgroundColor: 'var(--bottom-nav-bg)',
        borderBottom: '1px solid var(--border)',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-end gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ backgroundColor: 'var(--bg-card-2)' }}
        >
          {theme === 'dark'
            ? <Sun size={15} style={{ color: 'var(--text-secondary)' }} />
            : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
          }
        </button>

        {user && (
          <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} size="sm" />
        )}
      </div>
    </header>
  )
}
