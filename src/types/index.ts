export type TeamCode = string

export interface Team {
  name: string
  code: TeamCode
  flag: string // emoji flag
  group: string
}

export interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  kickoffUtc: string // ISO 8601
  venue: string
  city: string
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final'
  group?: string
  matchday?: number
  homeScore: number | null
  awayScore: number | null
  status: 'scheduled' | 'live' | 'finished'
}

export interface User {
  id: string
  name: string
  avatarUrl: string | null
  color: string
  createdAt: string
}

export interface Bet {
  id: string
  userId: string
  matchId: string
  homeScore: number
  awayScore: number
  pointsEarned: number | null
  createdAt: string
  user?: User
  match?: Match
}

export interface LeaderboardEntry {
  user: User
  totalPoints: number
  totalBets: number
  exactScores: number
  correctResults: number
  rank: number
}

export type BetResult = 'exact' | 'correct_result_diff' | 'correct_result' | 'wrong' | 'pending'
