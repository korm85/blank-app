'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/components/providers/UserProvider'
import { usePlayers } from '@/components/providers/PlayersProvider'
import { Avatar } from '@/components/ui/Avatar'

export function Header() {
  const { userId } = useUser()
  const { players } = usePlayers()
  const user = players.find(p => p.id === userId)
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
      <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          ⚽ Boys For Goals
        </span>
        {user && (
          <Avatar name={user.name} color={user.color} avatarUrl={user.avatarUrl} size="sm" />
        )}
      </div>
    </header>
  )
}
