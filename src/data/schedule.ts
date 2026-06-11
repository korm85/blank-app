import type { Match, Team } from '@/types'

// Helper to build a team object
function team(name: string, code: string, flag: string, group: string): Team {
  return { name, code, flag, group }
}

// Helper to build a match object
function match(
  id: string,
  home: Team,
  away: Team,
  kickoffUtc: string,
  venue: string,
  city: string,
  group: string,
  matchday: number
): Match {
  return {
    id,
    homeTeam: home,
    awayTeam: away,
    kickoffUtc,
    venue,
    city,
    stage: 'group',
    group,
    matchday,
    homeScore: null,
    awayScore: null,
    status: 'scheduled'
  }
}

// Teams
const MEX = team('Mexico', 'MEX', '🇲🇽', 'A')
const RSA = team('South Africa', 'RSA', '🇿🇦', 'A')
const KOR = team('South Korea', 'KOR', '🇰🇷', 'A')
const CZE = team('Czech Republic', 'CZE', '🇨🇿', 'A')

const CAN = team('Canada', 'CAN', '🇨🇦', 'B')
const BIH = team('Bosnia & Herz.', 'BIH', '🇧🇦', 'B')
const QAT = team('Qatar', 'QAT', '🇶🇦', 'B')
const SUI = team('Switzerland', 'SUI', '🇨🇭', 'B')

const BRA = team('Brazil', 'BRA', '🇧🇷', 'C')
const MAR = team('Morocco', 'MAR', '🇲🇦', 'C')
const HAI = team('Haiti', 'HAI', '🇭🇹', 'C')
const SCO = team('Scotland', 'SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C')

const USA = team('USA', 'USA', '🇺🇸', 'D')
const PAR = team('Paraguay', 'PAR', '🇵🇾', 'D')
const AUS = team('Australia', 'AUS', '🇦🇺', 'D')
const TUR = team('Turkey', 'TUR', '🇹🇷', 'D')

const GER = team('Germany', 'GER', '🇩🇪', 'E')
const CUW = team('Curaçao', 'CUW', '🇨🇼', 'E')
const CIV = team('Ivory Coast', 'CIV', '🇨🇮', 'E')
const ECU = team('Ecuador', 'ECU', '🇪🇨', 'E')

const NED = team('Netherlands', 'NED', '🇳🇱', 'F')
const JPN = team('Japan', 'JPN', '🇯🇵', 'F')
const SWE = team('Sweden', 'SWE', '🇸🇪', 'F')
const TUN = team('Tunisia', 'TUN', '🇹🇳', 'F')

const BEL = team('Belgium', 'BEL', '🇧🇪', 'G')
const EGY = team('Egypt', 'EGY', '🇪🇬', 'G')
const IRN = team('Iran', 'IRN', '🇮🇷', 'G')
const NZL = team('New Zealand', 'NZL', '🇳🇿', 'G')

const ESP = team('Spain', 'ESP', '🇪🇸', 'H')
const CPV = team('Cape Verde', 'CPV', '🇨🇻', 'H')
const KSA = team('Saudi Arabia', 'KSA', '🇸🇦', 'H')
const URU = team('Uruguay', 'URU', '🇺🇾', 'H')

const FRA = team('France', 'FRA', '🇫🇷', 'I')
const SEN = team('Senegal', 'SEN', '🇸🇳', 'I')
const IRQ = team('Iraq', 'IRQ', '🇮🇶', 'I')
const NOR = team('Norway', 'NOR', '🇳🇴', 'I')

const ARG = team('Argentina', 'ARG', '🇦🇷', 'J')
const ALG = team('Algeria', 'ALG', '🇩🇿', 'J')
const AUT = team('Austria', 'AUT', '🇦🇹', 'J')
const JOR = team('Jordan', 'JOR', '🇯🇴', 'J')

const POR = team('Portugal', 'POR', '🇵🇹', 'K')
const COD = team('DR Congo', 'COD', '🇨🇩', 'K')
const UZB = team('Uzbekistan', 'UZB', '🇺🇿', 'K')
const COL = team('Colombia', 'COL', '🇨🇴', 'K')

const ENG = team('England', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'L')
const CRO = team('Croatia', 'CRO', '🇭🇷', 'L')
const GHA = team('Ghana', 'GHA', '🇬🇭', 'L')
const PAN = team('Panama', 'PAN', '🇵🇦', 'L')

export const GROUP_STAGE_MATCHES: Match[] = [
  // GROUP A
  match('a1', MEX, RSA, '2026-06-11T19:00:00Z', 'Estadio Azteca', 'Mexico City', 'A', 1),
  match('a2', KOR, CZE, '2026-06-12T02:00:00Z', 'Estadio Akron', 'Guadalajara', 'A', 1),
  match('a3', CZE, RSA, '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'A', 2),
  match('a4', MEX, KOR, '2026-06-19T01:00:00Z', 'Estadio Akron', 'Guadalajara', 'A', 2),
  match('a5', CZE, MEX, '2026-06-25T01:00:00Z', 'Estadio Azteca', 'Mexico City', 'A', 3),
  match('a6', RSA, KOR, '2026-06-25T01:00:00Z', 'Estadio Akron', 'Guadalajara', 'A', 3),

  // GROUP B
  match('b1', CAN, BIH, '2026-06-12T19:00:00Z', 'BMO Field', 'Toronto', 'B', 1),
  match('b2', QAT, SUI, '2026-06-13T01:00:00Z', "Levi's Stadium", 'Santa Clara', 'B', 1),
  match('b3', SUI, BIH, '2026-06-18T19:00:00Z', 'SoFi Stadium', 'Los Angeles', 'B', 2),
  match('b4', CAN, QAT, '2026-06-18T22:00:00Z', 'BC Place', 'Vancouver', 'B', 2),
  match('b5', SUI, CAN, '2026-06-24T19:00:00Z', 'BC Place', 'Vancouver', 'B', 3),
  match('b6', BIH, QAT, '2026-06-24T19:00:00Z', 'Lumen Field', 'Seattle', 'B', 3),

  // GROUP C
  match('c1', BRA, SCO, '2026-06-13T20:00:00Z', 'SoFi Stadium', 'Los Angeles', 'C', 1),
  match('c2', MAR, HAI, '2026-06-13T23:00:00Z', 'Hard Rock Stadium', 'Miami', 'C', 1),
  match('c3', BRA, MAR, '2026-06-20T22:00:00Z', 'Hard Rock Stadium', 'Miami', 'C', 2),
  match('c4', HAI, SCO, '2026-06-21T01:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'C', 2),
  match('c5', BRA, HAI, '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'C', 3),
  match('c6', MAR, SCO, '2026-06-24T22:00:00Z', 'Hard Rock Stadium', 'Miami', 'C', 3),

  // GROUP D
  match('d1', USA, PAR, '2026-06-13T01:00:00Z', 'SoFi Stadium', 'Los Angeles', 'D', 1),
  match('d2', AUS, TUR, '2026-06-13T04:00:00Z', 'BC Place', 'Vancouver', 'D', 1),
  match('d3', USA, AUS, '2026-06-19T19:00:00Z', 'Lumen Field', 'Seattle', 'D', 2),
  match('d4', TUR, PAR, '2026-06-20T03:00:00Z', "Levi's Stadium", 'Santa Clara', 'D', 2),
  match('d5', TUR, USA, '2026-06-26T02:00:00Z', 'SoFi Stadium', 'Los Angeles', 'D', 3),
  match('d6', PAR, AUS, '2026-06-26T02:00:00Z', "Levi's Stadium", 'Santa Clara', 'D', 3),

  // GROUP E
  match('e1', GER, CUW, '2026-06-14T17:00:00Z', 'Arrowhead Stadium', 'Kansas City', 'E', 1),
  match('e2', CIV, ECU, '2026-06-14T23:00:00Z', 'BMO Field', 'Toronto', 'E', 1),
  match('e3', GER, CIV, '2026-06-20T20:00:00Z', 'BMO Field', 'Toronto', 'E', 2),
  match('e4', ECU, CUW, '2026-06-21T00:00:00Z', 'Arrowhead Stadium', 'Kansas City', 'E', 2),
  match('e5', GER, ECU, '2026-06-26T23:00:00Z', 'AT&T Stadium', 'Arlington', 'E', 3),
  match('e6', CIV, CUW, '2026-06-26T23:00:00Z', 'NRG Stadium', 'Houston', 'E', 3),

  // GROUP F
  match('f1', NED, JPN, '2026-06-14T20:00:00Z', 'AT&T Stadium', 'Arlington', 'F', 1),
  match('f2', SWE, TUN, '2026-06-15T02:00:00Z', 'Estadio BBVA', 'Monterrey', 'F', 1),
  match('f3', NED, SWE, '2026-06-20T17:00:00Z', 'NRG Stadium', 'Houston', 'F', 2),
  match('f4', TUN, JPN, '2026-06-21T04:00:00Z', 'Estadio BBVA', 'Monterrey', 'F', 2),
  match('f5', JPN, SWE, '2026-06-25T23:00:00Z', 'AT&T Stadium', 'Arlington', 'F', 3),
  match('f6', TUN, NED, '2026-06-25T23:00:00Z', 'Arrowhead Stadium', 'Kansas City', 'F', 3),

  // GROUP G
  match('g1', BEL, EGY, '2026-06-15T19:00:00Z', 'Lumen Field', 'Seattle', 'G', 1),
  match('g2', IRN, NZL, '2026-06-16T04:00:00Z', 'SoFi Stadium', 'Los Angeles', 'G', 1),
  match('g3', BEL, IRN, '2026-06-21T19:00:00Z', 'SoFi Stadium', 'Los Angeles', 'G', 2),
  match('g4', NZL, EGY, '2026-06-22T01:00:00Z', 'BC Place', 'Vancouver', 'G', 2),
  match('g5', BEL, NZL, '2026-06-27T00:00:00Z', 'BC Place', 'Vancouver', 'G', 3),
  match('g6', EGY, IRN, '2026-06-27T00:00:00Z', 'Lumen Field', 'Seattle', 'G', 3),

  // GROUP H
  match('h1', ESP, CPV, '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'H', 1),
  match('h2', KSA, URU, '2026-06-15T22:00:00Z', 'Hard Rock Stadium', 'Miami', 'H', 1),
  match('h3', ESP, KSA, '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'H', 2),
  match('h4', URU, CPV, '2026-06-21T22:00:00Z', 'Hard Rock Stadium', 'Miami', 'H', 2),
  match('h5', ESP, URU, '2026-06-26T22:00:00Z', 'Hard Rock Stadium', 'Miami', 'H', 3),
  match('h6', CPV, KSA, '2026-06-26T22:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'H', 3),

  // GROUP I
  match('i1', FRA, SEN, '2026-06-16T19:00:00Z', 'MetLife Stadium', 'East Rutherford', 'I', 1),
  match('i2', IRQ, NOR, '2026-06-16T22:00:00Z', 'Gillette Stadium', 'Foxborough', 'I', 1),
  match('i3', FRA, IRQ, '2026-06-22T21:00:00Z', 'Lincoln Financial Field', 'Philadelphia', 'I', 2),
  match('i4', NOR, SEN, '2026-06-23T00:00:00Z', 'MetLife Stadium', 'East Rutherford', 'I', 2),
  match('i5', FRA, NOR, '2026-06-26T19:00:00Z', 'MetLife Stadium', 'East Rutherford', 'I', 3),
  match('i6', SEN, IRQ, '2026-06-26T19:00:00Z', 'BMO Field', 'Toronto', 'I', 3),

  // GROUP J
  match('j1', ARG, ALG, '2026-06-17T01:00:00Z', 'Arrowhead Stadium', 'Kansas City', 'J', 1),
  match('j2', AUT, JOR, '2026-06-17T04:00:00Z', "Levi's Stadium", 'Santa Clara', 'J', 1),
  match('j3', ARG, AUT, '2026-06-22T17:00:00Z', 'AT&T Stadium', 'Arlington', 'J', 2),
  match('j4', JOR, ALG, '2026-06-23T03:00:00Z', "Levi's Stadium", 'Santa Clara', 'J', 2),
  match('j5', JOR, ARG, '2026-06-28T02:00:00Z', 'AT&T Stadium', 'Arlington', 'J', 3),
  match('j6', ALG, AUT, '2026-06-28T02:00:00Z', 'Arrowhead Stadium', 'Kansas City', 'J', 3),

  // GROUP K
  match('k1', POR, COD, '2026-06-17T17:00:00Z', 'NRG Stadium', 'Houston', 'K', 1),
  match('k2', UZB, COL, '2026-06-18T02:00:00Z', 'Estadio Azteca', 'Mexico City', 'K', 1),
  match('k3', POR, UZB, '2026-06-23T17:00:00Z', 'NRG Stadium', 'Houston', 'K', 2),
  match('k4', COL, COD, '2026-06-24T02:00:00Z', 'Estadio Akron', 'Guadalajara', 'K', 2),
  match('k5', COL, POR, '2026-06-27T23:30:00Z', 'Hard Rock Stadium', 'Miami', 'K', 3),
  match('k6', COD, UZB, '2026-06-27T23:30:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'K', 3),

  // GROUP L
  match('l1', ENG, CRO, '2026-06-17T20:00:00Z', 'AT&T Stadium', 'Arlington', 'L', 1),
  match('l2', GHA, PAN, '2026-06-17T23:00:00Z', 'BMO Field', 'Toronto', 'L', 1),
  match('l3', ENG, GHA, '2026-06-23T20:00:00Z', 'Gillette Stadium', 'Foxborough', 'L', 2),
  match('l4', PAN, CRO, '2026-06-23T23:00:00Z', 'BMO Field', 'Toronto', 'L', 2),
  match('l5', ENG, PAN, '2026-06-27T20:00:00Z', 'Gillette Stadium', 'Foxborough', 'L', 3),
  match('l6', CRO, GHA, '2026-06-27T20:00:00Z', 'AT&T Stadium', 'Arlington', 'L', 3),
]

export const ALL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function getMatchesByDate(dateStr: string): Match[] {
  return GROUP_STAGE_MATCHES.filter(m => m.kickoffUtc.startsWith(dateStr))
}

export function getTodayMatches(): Match[] {
  const today = new Date().toISOString().split('T')[0]
  return GROUP_STAGE_MATCHES.filter(m => m.kickoffUtc.startsWith(today))
}

export function getNextMatch(): Match | null {
  const now = new Date()
  const upcoming = GROUP_STAGE_MATCHES
    .filter(m => new Date(m.kickoffUtc) > now && m.status === 'scheduled')
    .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime())
  return upcoming[0] ?? null
}

export function getUpcomingTodayMatches(): Match[] {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const cutoff = new Date(now.getTime() + 5 * 60 * 1000)
  return GROUP_STAGE_MATCHES.filter(m => {
    const kickoff = new Date(m.kickoffUtc)
    return m.kickoffUtc.startsWith(today) && kickoff > cutoff
  })
}
