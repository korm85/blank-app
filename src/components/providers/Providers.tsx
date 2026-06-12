'use client'

import { UserProvider } from './UserProvider'
import { PlayersProvider } from './PlayersProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlayersProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </PlayersProvider>
  )
}
