export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const MIGRATIONS = [
  `create extension if not exists "uuid-ossp"`,
  `create table if not exists public.profiles (
    id uuid primary key default uuid_generate_v4(),
    chat_id text unique not null,
    name text not null default 'Мила',
    language text not null default 'ru' check (language in ('ru', 'he')),
    timezone text not null default 'Asia/Jerusalem',
    onboarded boolean not null default false,
    voice_enabled boolean not null default true,
    created_at timestamptz default now()
  )`,
  `create table if not exists public.schedules (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    weekday smallint not null check (weekday between 0 and 6),
    time_local text not null,
    duration_minutes smallint not null default 20,
    active boolean not null default true,
    created_at timestamptz default now()
  )`,
  `create table if not exists public.sessions (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    scheduled_for timestamptz not null,
    week_start date not null,
    status text not null default 'pending' check (status in ('pending', 'prompted', 'completed', 'rescheduled', 'missed')),
    origin text not null default 'scheduled' check (origin in ('scheduled', 'delayed', 'rescheduled')),
    prompt_count smallint not null default 0,
    last_prompted_at timestamptz,
    created_at timestamptz default now()
  )`,
  `create table if not exists public.messages (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz default now()
  )`,
  `create table if not exists public.webhook_log (
    id bigint generated always as identity primary key,
    received_at timestamptz,
    type text,
    payload text,
    update_id bigint unique
  )`,
  `create index if not exists schedules_profile_id_idx on public.schedules(profile_id)`,
  `create index if not exists sessions_profile_id_idx on public.sessions(profile_id)`,
  `create index if not exists sessions_status_idx on public.sessions(status)`,
  `create index if not exists sessions_scheduled_for_idx on public.sessions(scheduled_for)`,
  `create index if not exists sessions_week_start_idx on public.sessions(profile_id, week_start)`,
  `create index if not exists messages_profile_id_idx on public.messages(profile_id, created_at)`,
  `alter table public.profiles enable row level security`,
  `alter table public.schedules enable row level security`,
  `alter table public.sessions enable row level security`,
  `alter table public.messages enable row level security`,
  `alter table public.webhook_log enable row level security`,
  `do $$ begin
    create policy "Allow all on profiles" on public.profiles for all using (true) with check (true);
  exception when duplicate_object then null; end $$`,
  `do $$ begin
    create policy "Allow all on schedules" on public.schedules for all using (true) with check (true);
  exception when duplicate_object then null; end $$`,
  `do $$ begin
    create policy "Allow all on sessions" on public.sessions for all using (true) with check (true);
  exception when duplicate_object then null; end $$`,
  `do $$ begin
    create policy "Allow all on messages" on public.messages for all using (true) with check (true);
  exception when duplicate_object then null; end $$`,
  `do $$ begin
    create policy "Allow all on webhook_log" on public.webhook_log for all using (true) with check (true);
  exception when duplicate_object then null; end $$`,
]

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')
  const bypass = url.searchParams.get('x-vercel-protection-bypass')
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
      const label = sql.slice(0, 60).replace(/\s+/g, ' ')
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
