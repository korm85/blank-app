import type { User } from '@/types'

export const STATIC_USERS: Omit<User, 'createdAt'>[] = [
  { id: 'oz', name: 'Oz', avatarUrl: null, color: '#FF6B35' },
  { id: 'boris', name: 'Boris', avatarUrl: null, color: '#4ECDC4' },
  { id: 'vitali', name: 'Vitali', avatarUrl: null, color: '#45B7D1' },
  { id: 'edi', name: 'Edi', avatarUrl: null, color: '#96CEB4' },
  { id: 'michael', name: 'Michael', avatarUrl: null, color: '#FFD60A' },
]

export const COLOR_PALETTE = [
  '#FF6B35', '#FF3B30', '#FF9F0A', '#FFD60A',
  '#30D158', '#4ECDC4', '#45B7D1', '#5AC8FA',
  '#AF52DE', '#FF375F', '#96CEB4', '#6E6E73',
]

export function getUserById(id: string, extras: Omit<User, 'createdAt'>[] = []): Omit<User, 'createdAt'> | undefined {
  return [...STATIC_USERS, ...extras].find(u => u.id === id)
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user'
}
