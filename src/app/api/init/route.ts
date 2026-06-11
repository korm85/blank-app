import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const SCHEMA_SQL = `
create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id text primary key,
  name text not null,
  avatar_url text,
  color text not null default '#FFD60A',
  created_at timestamptz default now()
);

create table if not exists public.matches (
  id text primary key,
  home_team_name text not null,
  home_team_code text not null,
  home_team_flag text not null,
  away_team_name text not null,
  away_team_code text not null,
  away_team_flag text not null,
  kickoff_utc timestamptz not null,
  venue text not null,
  city text not null,
  stage text not null default 'group',
  group_name text,
  matchday integer,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists public.bets (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references public.users(id),
  match_id text not null references public.matches(id),
  home_score integer not null,
  away_score integer not null,
  points_earned integer,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

create index if not exists bets_user_id_idx on public.bets(user_id);
create index if not exists bets_match_id_idx on public.bets(match_id);
create index if not exists matches_kickoff_idx on public.matches(kickoff_utc);

alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.bets enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='users' and policyname='Allow all on users') then
    create policy "Allow all on users" on public.users for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='matches' and policyname='Allow all on matches') then
    create policy "Allow all on matches" on public.matches for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='bets' and policyname='Allow all on bets') then
    create policy "Allow all on bets" on public.bets for all using (true) with check (true);
  end if;
end $$;

insert into public.users (id, name, color) values
  ('oz', 'Oz', '#FF6B35'),
  ('boris', 'Boris', '#4ECDC4'),
  ('vitali', 'Vitali', '#45B7D1'),
  ('edi', 'Edi', '#96CEB4'),
  ('michael', 'Michael', '#FFD60A')
on conflict (id) do nothing;
`

const REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'ca-central-1', 'sa-east-1'
]

async function tryConnect(ref: string, password: string, region: string): Promise<Client | null> {
  const client = new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000,
  })
  try {
    await client.connect()
    return client
  } catch {
    return null
  }
}

// GET /api/init?key=bfg-goals-2026&dbpass=YOUR_DB_PASSWORD
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ref = process.env.SUPABASE_PROJECT_REF!
  // Accept password from env var (production) or query param (first-time setup)
  const password = process.env.SUPABASE_DB_PASSWORD ?? req.nextUrl.searchParams.get('dbpass')

  if (!password) {
    return NextResponse.json({ error: 'dbpass parameter required for first-time setup' }, { status: 400 })
  }

  let client: Client | null = null
  let connectedRegion = ''

  for (const region of REGIONS) {
    client = await tryConnect(ref, password, region)
    if (client) { connectedRegion = region; break }
  }

  if (!client) {
    return NextResponse.json({ error: 'Could not connect to database. Check password and try again.' }, { status: 500 })
  }

  try {
    await client.query(SCHEMA_SQL)
    await client.end()
    return NextResponse.json({
      success: true,
      region: connectedRegion,
      message: 'Database initialized — tables, RLS policies, and users created.'
    })
  } catch (e: unknown) {
    await client.end()
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
