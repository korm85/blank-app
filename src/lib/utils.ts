import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isBettingOpen(kickoffUtc: string): boolean {
  const kickoff = new Date(kickoffUtc)
  const cutoff = new Date(kickoff.getTime() + 5 * 60 * 1000)
  return new Date() < cutoff
}

export function isToday(dateUtc: string): boolean {
  const date = new Date(dateUtc)
  const now = new Date()
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  )
}

export function formatKickoff(kickoffUtc: string): string {
  const date = new Date(kickoffUtc)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatKickoffUTC(kickoffUtc: string): string {
  const date = new Date(kickoffUtc)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  })
}

export function formatMatchDate(kickoffUtc: string): string {
  const date = new Date(kickoffUtc)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
}
