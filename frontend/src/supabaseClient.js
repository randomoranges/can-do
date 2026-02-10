import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hyjkrbnsftuouaitbdkr.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amtyYm5zZnR1b3VhaXRiZGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDQxNzAsImV4cCI6MjA4NjMyMDE3MH0.Bf15KMd0-KXmx2k3suuUc3n42eGxheRbNXDZ6iJmVRY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
