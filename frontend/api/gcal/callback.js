import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://doit-ten-flax.vercel.app';
  const GCAL_CLIENT_ID = process.env.GCAL_CLIENT_ID;
  const GCAL_CLIENT_SECRET = process.env.GCAL_CLIENT_SECRET;
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hyjkrbnsftuouaitbdkr.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (error) {
    return res.redirect(`${FRONTEND_URL}?gcal_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}?gcal_error=missing_params`);
  }

  // Parse state: "userId:profile"
  const parts = state.split(':');
  if (parts.length < 2) {
    return res.redirect(`${FRONTEND_URL}?gcal_error=invalid_state`);
  }
  const userId = parts[0];
  const profile = parts[1];

  try {
    // Exchange code for tokens
    const redirectUri = `${FRONTEND_URL}/api/gcal/callback`;
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GCAL_CLIENT_ID,
        client_secret: GCAL_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResp.ok) {
      const errBody = await tokenResp.text();
      console.error('Token exchange failed:', errBody);
      return res.redirect(`${FRONTEND_URL}?gcal_error=token_exchange_failed`);
    }

    const tokens = await tokenResp.json();
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token || '';
    const expiresIn = tokens.expires_in || 3600;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Get Google email
    const userinfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let googleEmail = '';
    if (userinfoResp.ok) {
      const userinfo = await userinfoResp.json();
      googleEmail = userinfo.email || '';
    }

    // Upsert to database using service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: dbError } = await supabase
      .from('google_calendar_accounts')
      .upsert(
        {
          user_id: userId,
          profile,
          google_email: googleEmail,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,profile' }
      );

    if (dbError) {
      console.error('DB upsert error:', dbError);
      return res.redirect(`${FRONTEND_URL}?gcal_error=db_error`);
    }

    return res.redirect(`${FRONTEND_URL}?gcal_connected=${profile}`);
  } catch (err) {
    console.error('Callback error:', err);
    return res.redirect(`${FRONTEND_URL}?gcal_error=server_error`);
  }
}
