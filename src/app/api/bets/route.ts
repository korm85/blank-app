import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const matchId = req.nextUrl.searchParams.get('matchId')
  const userId = req.nextUrl.searchParams.get('userId')

  let query = supabase.from('bets').select('*')
  if (matchId) query = query.eq('match_id', matchId)
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { userId, matchId, homeScore, awayScore } = body

  if (!userId || !matchId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bets')
    .upsert(
      { user_id: userId, match_id: matchId, home_score: homeScore, away_score: awayScore },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
