'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePlayers } from './PlayersProvider'

interface UserContextType {
  userId: string | null
  setUserId: (id: string) => void
  isLoggedIn: boolean
}

const UserContext = createContext<UserContextType>({
  userId: null,
  setUserId: () => {},
  isLoggedIn: false,
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { players } = usePlayers()
  const [userId, setUserIdState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('bfg_user_id')
    if (stored && players.find(u => u.id === stored)) {
      setUserIdState(stored)
    }
  }, [players])

  const setUserId = (id: string) => {
    localStorage.setItem('bfg_user_id', id)
    setUserIdState(id)
  }

  return (
    <UserContext.Provider value={{ userId, setUserId, isLoggedIn: !!userId }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
