-- ============================================================
-- Happy v2 - Add location, fix cron credential storage
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add location column to happy_settings
alter table happy_settings
  add column if not exists location text default '';

-- ============================================================
-- Fix cron: Store credentials in app_config table
-- No superuser/ALTER DATABASE needed - works from SQL Editor
-- ============================================================

-- Ensure app_config table exists (also created in main migration)
create table if not exists app_config (
  key text primary key,
  value text not null
);
alter table app_config enable row level security;

-- INSERT YOUR ACTUAL VALUES HERE:
-- Replace the placeholder values below with your real credentials from:
-- Supabase Dashboard → Settings → API
insert into app_config (key, value) values
  ('supabase_url', 'https://hyjkrbnsftuouaitbdkr.supabase.co'),
  ('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE')
on conflict (key) do update set value = excluded.value;

-- Update the function to read from app_config instead of current_setting()
create or replace function invoke_happy_job(job_type text)
returns void as $$
declare
  edge_function_url text;
  service_role_key text;
begin
  select value into edge_function_url from app_config where key = 'supabase_url';
  edge_function_url := edge_function_url || '/functions/v1/happy';
  select value into service_role_key from app_config where key = 'service_role_key';

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
