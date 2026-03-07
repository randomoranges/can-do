import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, profile, timezone } = req.query;

  if (!user_id || !profile) {
    return res.status(400).json({ error: 'Missing user_id or profile' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hyjkrbnsftuouaitbdkr.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const GCAL_CLIENT_ID = process.env.GCAL_CLIENT_ID;
  const GCAL_CLIENT_SECRET = process.env.GCAL_CLIENT_SECRET;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get the calendar account for this user+profile
    const { data: account, error: dbError } = await supabase
      .from('google_calendar_accounts')
      .select('*')
      .eq('user_id', user_id)
      .eq('profile', profile)
      .single();

    if (dbError || !account) {
      return res.status(200).json({ today: [], tomorrow: [] });
    }

    // Refresh token if needed
    let accessToken = account.access_token;
    const expiresAt = new Date(account.token_expires_at);

    if (Date.now() >= expiresAt.getTime() - 5 * 60 * 1000) {
      if (!GCAL_CLIENT_ID || !GCAL_CLIENT_SECRET || !account.refresh_token) {
        return res.status(200).json({ today: [], tomorrow: [] });
      }

      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GCAL_CLIENT_ID,
          client_secret: GCAL_CLIENT_SECRET,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (tokenResp.ok) {
        const tokens = await tokenResp.json();
        accessToken = tokens.access_token;
        const newExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

        await supabase
          .from('google_calendar_accounts')
          .update({ access_token: accessToken, token_expires_at: newExpiresAt, updated_at: new Date().toISOString() })
          .eq('id', account.id);
      }
    }

    // Calculate today/tomorrow boundaries
    const tz = timezone || 'America/New_York';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    const todayStr = formatter.format(now);
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = formatter.format(tomorrowDate);
    const dayAfterDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dayAfterStr = formatter.format(dayAfterDate);

    const fetchEvents = async (timeMin, timeMax) => {
      const params = new URLSearchParams({
        timeMin: `${timeMin}T00:00:00`,
        timeMax: `${timeMax}T00:00:00`,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
        timeZone: tz,
      });

      const resp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!resp.ok) {
        console.error('Google Calendar API error:', await resp.text());
        return [];
      }

      const data = await resp.json();
      return (data.items || []).map((item) => {
        const start = item.start || {};
        const end = item.end || {};
        return {
          id: item.id,
          title: item.summary || '(No title)',
          start: start.dateTime || start.date || '',
          end: end.dateTime || end.date || '',
          all_day: 'date' in start && !('dateTime' in start),
          location: item.location || '',
        };
      });
    };

    const [todayEvents, tomorrowEvents] = await Promise.all([
      fetchEvents(todayStr, tomorrowStr),
      fetchEvents(tomorrowStr, dayAfterStr),
    ]);

    return res.status(200).json({ today: todayEvents, tomorrow: tomorrowEvents });
  } catch (err) {
    console.error('Calendar events error:', err);
    return res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
}
