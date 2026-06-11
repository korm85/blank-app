import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints } from '@/lib/scoring'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// POST /api/scores — admin updates a match result + grades all bets
// Body: { matchId, homeScore, awayScore, adminKey }
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { matchId, homeScore, awayScore, adminKey } = body

  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Update match
  const { error: matchError } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status: 'finished' })
    .eq('id', matchId)

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 })

  // Grade bets
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('*')
    .eq('match_id', matchId)

  if (betsError) return NextResponse.json({ error: betsError.message }, { status: 500 })

  if (bets && bets.length > 0) {
    const updates = bets.map((bet: Record<string, unknown>) => {
      const { points } = calculatePoints(
        bet.home_score as number,
        bet.away_score as number,
        homeScore,
        awayScore
      )
      return { id: bet.id, points_earned: points }
    })

    for (const update of updates) {
      await supabase
        .from('bets')
        .update({ points_earned: update.points_earned })
        .eq('id', update.id)
    }
  }

  return NextResponse.json({ success: true, betsGraded: bets?.length ?? 0 })
}
