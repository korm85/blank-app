-- Анна — WhatsApp fitness companion for Mila
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- One profile: Mila. Table shape supports more than one, but the app is single-user.
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  wa_chat_id text unique not null,
  name text not null default 'Мила',
  language text not null default 'ru' check (language in ('ru', 'he')),
  timezone text not null default 'Asia/Jerusalem',
  onboarded boolean not null default false,
  voice_enabled boolean not null default true,
  created_at timestamptz default now()
);

-- Exactly 2 active rows per profile in app logic (not DB-enforced).
create table if not exists public.schedules (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=Sunday .. 6=Saturday
  time_local text not null, -- 'HH:MM'
  duration_minutes smallint not null default 20,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- One row per workout occurrence.
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_for timestamptz not null,
  week_start date not null, -- Monday of the ISO week, in profile's timezone
  status text not null default 'pending' check (status in ('pending', 'prompted', 'completed', 'rescheduled', 'missed')),
  origin text not null default 'scheduled' check (origin in ('scheduled', 'delayed', 'rescheduled')),
  prompt_count smallint not null default 0,
  last_prompted_at timestamptz,
  created_at timestamptz default now()
);

-- Full conversation history, used to build the agent's context window.
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Raw Green API webhook log, for debugging and idempotency (id_message dedupes retried webhooks).
create table if not exists public.webhook_log (
  id bigint generated always as identity primary key,
  received_at timestamptz,
  type text,
  payload text,
  id_message text unique
);

-- Indexes
create index if not exists schedules_profile_id_idx on public.schedules(profile_id);
create index if not exists sessions_profile_id_idx on public.sessions(profile_id);
create index if not exists sessions_status_idx on public.sessions(status);
create index if not exists sessions_scheduled_for_idx on public.sessions(scheduled_for);
create index if not exists sessions_week_start_idx on public.sessions(profile_id, week_start);
create index if not exists messages_profile_id_idx on public.messages(profile_id, created_at);

-- RLS (single-user app; server routes use the service-role key for writes)
alter table public.profiles enable row level security;
alter table public.schedules enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.webhook_log enable row level security;

create policy "Allow all on profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all on schedules" on public.schedules for all using (true) with check (true);
create policy "Allow all on sessions" on public.sessions for all using (true) with check (true);
create policy "Allow all on messages" on public.messages for all using (true) with check (true);
create policy "Allow all on webhook_log" on public.webhook_log for all using (true) with check (true);
