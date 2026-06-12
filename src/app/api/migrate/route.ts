export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const MIGRATIONS = [
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS claimed boolean DEFAULT false`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_team text`,
  `CREATE TABLE IF NOT EXISTS webhook_log (
    id bigint generated always as identity primary key,
    received_at timestamptz,
    type text,
    payload text
  )`,
]

export async function GET(req: NextRequest) {
  const bypass = new URL(req.url).searchParams.get('x-vercel-protection-bypass')
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY && bypass !== process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return NextResponse.json({
      error: 'DATABASE_URL not set',
      hint: 'Add it from: Supabase Dashboard → Settings → Database → Connection string → URI (use Transaction pooler for serverless)',
      dashboardSql: `https://supabase.com/dashboard/project/${ref}/sql/new`,
      sql: MIGRATIONS,
    })
  }

  const client = new Client({ connectionString: dbUrl })
  const results: Record<string, string> = {}
  try {
    await client.connect()
    for (const sql of MIGRATIONS) {
      const label = sql.slice(0, 50).replace(/\s+/g, ' ')
      try {
        await client.query(sql)
        results[label] = '✅'
      } catch (e) {
        results[label] = `❌ ${e}`
      }
    }
  } finally {
    await client.end()
  }

  return NextResponse.json({ ok: true, results })
}
