-- Boys For Goals - World Cup 2026 Betting App
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists public.users (
  id text primary key,
  name text not null,
  avatar_url text,
  color text not null default '#FFD60A',
  created_at timestamptz default now()
);

-- Matches table
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

-- Bets table
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

-- Indexes
create index if not exists bets_user_id_idx on public.bets(user_id);
create index if not exists bets_match_id_idx on public.bets(match_id);
create index if not exists matches_kickoff_idx on public.matches(kickoff_utc);
create index if not exists matches_status_idx on public.matches(status);

-- RLS policies (allow all for simplicity - friends app)
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.bets enable row level security;

create policy "Allow all on users" on public.users for all using (true) with check (true);
create policy "Allow all on matches" on public.matches for all using (true) with check (true);
create policy "Allow all on bets" on public.bets for all using (true) with check (true);

-- Seed users
insert into public.users (id, name, color) values
  ('oz', 'Oz', '#FF6B35'),
  ('boris', 'Boris', '#4ECDC4'),
  ('vitali', 'Vitali', '#45B7D1'),
  ('edi', 'Edi', '#96CEB4'),
  ('michael', 'Michael', '#FFD60A')
on conflict (id) do nothing;
