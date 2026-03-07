-- ============================================================
-- Google Calendar Integration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Google Calendar accounts (up to 2 per user: one personal, one work)
create table if not exists google_calendar_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile text not null check (profile in ('personal', 'work')),
  google_email text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  calendar_id text not null default 'primary',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- One calendar account per profile per user
  unique(user_id, profile)
);

-- Indexes
create index if not exists idx_gcal_accounts_user on google_calendar_accounts(user_id);

-- Enable RLS
alter table google_calendar_accounts enable row level security;

-- RLS Policies
create policy "Users can view own calendar accounts"
  on google_calendar_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own calendar accounts"
  on google_calendar_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own calendar accounts"
  on google_calendar_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own calendar accounts"
  on google_calendar_accounts for delete using (auth.uid() = user_id);
