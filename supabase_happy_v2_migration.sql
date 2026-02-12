-- ============================================================
-- Happy v2 - Add location, fix cron scheduling
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add location column to happy_settings
alter table happy_settings
  add column if not exists location text default '';

-- ============================================================
-- Fix cron: Set database config for edge function invocation
-- IMPORTANT: Replace the service_role_key below with your actual key
-- Found in: Supabase Dashboard → Settings → API → service_role (secret)
-- ============================================================

-- Set your Supabase URL (replace if different)
alter database postgres set app.settings.supabase_url to 'https://hyjkrbnsftuouaitbdkr.supabase.co';

-- SET YOUR SERVICE ROLE KEY HERE (replace the placeholder)
alter database postgres set app.settings.service_role_key to 'YOUR_SERVICE_ROLE_KEY_HERE';

-- Reload config so cron picks it up
select pg_reload_conf();
