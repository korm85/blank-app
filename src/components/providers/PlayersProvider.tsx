'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { STATIC_USERS, nameToId } from '@/lib/users'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

type Player = Omit<User, 'createdAt'>

interface PlayersContextType {
  players: Player[]
  addPlayer: (name: string, color: string) => Promise<Player>
  refreshPlayers: () => Promise<void>
}

const PlayersContext = createContext<PlayersContextType>({
  players: STATIC_USERS,
  addPlayer: async () => STATIC_USERS[0],
  refreshPlayers: async () => {},
})

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(STATIC_USERS)

  const refreshPlayers = useCallback(async () => {
    try {
      const { data } = await supabase.from('users').select('id, name, avatar_url, color').order('created_at')
      if (data && data.length > 0) {
        setPlayers(data.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: u.name as string,
          avatarUrl: u.avatar_url as string | null,
          color: u.color as string,
        })))
      }
    } catch { /* fall back to static */ }
  }, [])

  useEffect(() => { refreshPlayers() }, [refreshPlayers])

  const addPlayer = async (name: string, color: string): Promise<Player> => {
    const baseId = nameToId(name)
    // ensure unique id
    let id = baseId
    let suffix = 1
    while (players.find(p => p.id === id)) {
      id = `${baseId}${suffix++}`
    }
    const newPlayer: Player = { id, name: name.trim(), avatarUrl: null, color }
    try {
      await supabase.from('users').insert({ id, name: name.trim(), color })
    } catch { /* ignore — will still work locally */ }
    setPlayers(prev => [...prev, newPlayer])
    return newPlayer
  }

  return (
    <PlayersContext.Provider value={{ players, addPlayer, refreshPlayers }}>
      {children}
    </PlayersContext.Provider>
  )
}

export function usePlayers() {
  return useContext(PlayersContext)
}
