-- ============================================================
-- Happy - AI Accountability Assistant
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Happy settings per user
create table if not exists happy_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  name text not null default 'Friend',
  email text not null,
  timezone text not null default 'America/New_York',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email log to prevent duplicate sends and for audit
create table if not exists happy_email_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null,
  subject text,
  sent_at timestamptz default now()
);

-- Track last time user opened the app (for inactivity detection)
alter table user_settings
  add column if not exists last_app_open timestamptz default now();

-- Indexes
create index if not exists idx_happy_settings_user on happy_settings(user_id);
create index if not exists idx_happy_email_log_user on happy_email_log(user_id, job_type, sent_at);
create index if not exists idx_happy_email_log_sent on happy_email_log(sent_at);

-- Enable RLS
alter table happy_settings enable row level security;
alter table happy_email_log enable row level security;

-- RLS Policies for happy_settings
create policy "Users can view own happy settings"
  on happy_settings for select using (auth.uid() = user_id);
create policy "Users can insert own happy settings"
  on happy_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own happy settings"
  on happy_settings for update using (auth.uid() = user_id);
create policy "Users can delete own happy settings"
  on happy_settings for delete using (auth.uid() = user_id);

-- RLS Policies for happy_email_log (read-only for users, edge functions use service role)
create policy "Users can view own email log"
  on happy_email_log for select using (auth.uid() = user_id);

-- Service role policy for edge functions to insert logs
-- (Edge functions use service_role key which bypasses RLS, but this is explicit)
create policy "Service can insert email logs"
  on happy_email_log for insert with check (true);

-- ============================================================
-- pg_cron setup for scheduled jobs
-- NOTE: Enable pg_cron extension first via Dashboard > Database > Extensions
-- ============================================================

-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper function to invoke the Happy edge function
create or replace function invoke_happy_job(job_type text)
returns void as $$
declare
  edge_function_url text;
  service_role_key text;
begin
  -- These will be set via Supabase secrets/config
  edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/happy';
  service_role_key := current_setting('app.settings.service_role_key', true);

  perform net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('job_type', job_type)
  );
end;
$$ language plpgsql security definer;

-- Schedule cron jobs (all times in UTC - users' timezone handled in edge function)
-- Morning briefing: runs every hour from 6-10 AM UTC to catch different timezones
select cron.schedule('happy-morning', '0 6,7,8,9,10,11,12,13,14 * * *', $$select invoke_happy_job('morning')$$);

-- Midday check-in: runs every hour from 12-18 UTC
select cron.schedule('happy-midday', '0 12,13,14,15,16,17,18,19,20 * * *', $$select invoke_happy_job('midday')$$);

-- Evening recap: runs every hour from 18-24 UTC
select cron.schedule('happy-evening', '0 18,19,20,21,22,23,0,1,2,3 * * *', $$select invoke_happy_job('evening')$$);

-- Friday wind down: runs hourly on Fridays to catch different timezone 6 PMs
select cron.schedule('happy-friday', '0 16,17,18,19,20,21,22,23,0,1,2 * * 5', $$select invoke_happy_job('friday')$$);

-- Sunday life check-in: runs hourly on Sundays for 7 PM across timezones
select cron.schedule('happy-sunday', '0 17,18,19,20,21,22,23,0,1,2,3 * * 0', $$select invoke_happy_job('sunday')$$);

-- Hourly check for event-based triggers (stale tasks, inactivity)
select cron.schedule('happy-hourly-check', '30 * * * *', $$select invoke_happy_job('hourly_check')$$);
