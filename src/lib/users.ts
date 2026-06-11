import type { User } from '@/types'

export const STATIC_USERS: Omit<User, 'createdAt'>[] = [
  { id: 'oz', name: 'Oz', avatarUrl: null, color: '#FF6B35' },
  { id: 'boris', name: 'Boris', avatarUrl: null, color: '#4ECDC4' },
  { id: 'vitali', name: 'Vitali', avatarUrl: null, color: '#45B7D1' },
  { id: 'edi', name: 'Edi', avatarUrl: null, color: '#96CEB4' },
  { id: 'michael', name: 'Michael', avatarUrl: null, color: '#FFD60A' },
]

export function getUserById(id: string): Omit<User, 'createdAt'> | undefined {
  return STATIC_USERS.find(u => u.id === id)
}

export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}
