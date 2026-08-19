export type Language = 'ru' | 'he'

export interface Profile {
  id: string
  chatId: string
  name: string
  language: Language
  timezone: string
  onboarded: boolean
  voiceEnabled: boolean
  createdAt: string
}

export interface Schedule {
  id: string
  profileId: string
  weekday: number // 0=Sunday .. 6=Saturday
  timeLocal: string // 'HH:MM'
  durationMinutes: number
  active: boolean
}

export type SessionStatus = 'pending' | 'prompted' | 'completed' | 'rescheduled' | 'missed'
export type SessionOrigin = 'scheduled' | 'delayed' | 'rescheduled'

export interface WorkoutSession {
  id: string
  profileId: string
  scheduledFor: string // ISO
  weekStart: string // date, Monday of the ISO week
  status: SessionStatus
  origin: SessionOrigin
  promptCount: number
  lastPromptedAt: string | null
}

export type MessageRole = 'user' | 'assistant'

export interface AnnaMessage {
  id: string
  profileId: string
  role: MessageRole
  content: string
  createdAt: string
}
