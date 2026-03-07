import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const appUrl = Deno.env.get("APP_URL") || "https://taskmaster-1575.preview.emergentagent.com";

  if (error) {
    return Response.redirect(`${appUrl}?gcal_error=${error}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${appUrl}?gcal_error=missing_params`, 302);
  }

  let userId: string;
  let profile: string;
  try {
    [userId, profile] = state.split(":", 2);
    if (!userId || !profile) throw new Error("invalid");
  } catch {
    return Response.redirect(`${appUrl}?gcal_error=invalid_state`, 302);
  }

  const gcalClientId = Deno.env.get("GCAL_CLIENT_ID");
  const gcalClientSecret = Deno.env.get("GCAL_CLIENT_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const redirectUri = `${supabaseUrl}/functions/v1/gcal-callback`;

  if (!gcalClientId || !gcalClientSecret) {
    return Response.redirect(`${appUrl}?gcal_error=not_configured`, 302);
  }

  // Exchange authorization code for tokens
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: gcalClientId,
      client_secret: gcalClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResp.ok) {
    console.error("Token exchange failed:", await tokenResp.text());
    return Response.redirect(`${appUrl}?gcal_error=token_exchange_failed`, 302);
  }

  const tokens = await tokenResp.json();
  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token || "";
  const expiresIn = tokens.expires_in || 3600;
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Get Google email for this account
  let googleEmail = "";
  try {
    const userinfoResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userinfoResp.ok) {
      const userinfo = await userinfoResp.json();
      googleEmail = userinfo.email || "";
    }
  } catch (e) {
    console.error("Failed to get userinfo:", e);
  }

  // Save to database using service role (bypass RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error: dbError } = await supabase
    .from("google_calendar_accounts")
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
      { onConflict: "user_id,profile" }
    );

  if (dbError) {
    console.error("DB upsert error:", dbError);
    return Response.redirect(`${appUrl}?gcal_error=db_error`, 302);
  }

  return Response.redirect(`${appUrl}?gcal_connected=${profile}`, 302);
});
