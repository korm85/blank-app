'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/bets', icon: CalendarDays, label: 'Matches' },
  { href: '/profile', icon: User, label: 'Me' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom"
      style={{ backgroundColor: 'var(--bottom-nav-bg)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-lg mx-auto px-2 flex items-center">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-90',
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? '#FFD60A' : 'var(--text-tertiary)' }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#FFD60A' : 'var(--text-tertiary)' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
