'use client'

import { ThemeProvider } from 'next-themes'
import { UserProvider } from './UserProvider'
import { PlayersProvider } from './PlayersProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <PlayersProvider>
        <UserProvider>
          {children}
        </UserProvider>
      </PlayersProvider>
    </ThemeProvider>
  )
}
