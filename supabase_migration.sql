-- ============================================================
-- DoIt App - Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Tasks table
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  profile text not null check (profile in ('personal', 'work')),
  section text not null check (section in ('today', 'tomorrow', 'someday')),
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Wins table (permanent completed task log)
create table if not exists wins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task text not null,
  completed_at timestamptz default now()
);

-- User settings table
create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  theme text default 'yellow',
  dark_mode text default 'auto',
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_tasks_user_profile on tasks(user_id, profile);
create index if not exists idx_wins_user on wins(user_id);
create index if not exists idx_wins_completed_at on wins(user_id, completed_at);

-- Enable Row Level Security
alter table tasks enable row level security;
alter table wins enable row level security;
alter table user_settings enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);

create policy "Users can view own wins" on wins for select using (auth.uid() = user_id);
create policy "Users can insert own wins" on wins for insert with check (auth.uid() = user_id);

create policy "Users can view own settings" on user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on user_settings for update using (auth.uid() = user_id);
