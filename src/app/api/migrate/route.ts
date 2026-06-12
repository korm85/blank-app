import { NextRequest, NextResponse } from 'next/server'

// GET /api/migrate?key=bfg-goals-2026
// Adds email/phone columns to users table via Supabase REST (no direct DB connection needed)
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Use Supabase SQL execution via rpc if available, otherwise return SQL for manual run
  const sql = `
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
  `.trim()

  return NextResponse.json({
    info: 'Run the following SQL in your Supabase SQL Editor to enable notification contacts:',
    sql,
    dashboardUrl: `https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_REF}/editor`,
  })
}
