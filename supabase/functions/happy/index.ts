import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// CONFIG
// ============================================================

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const GROK_MODEL = "grok-3-mini";
const GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const APP_URL = Deno.env.get("APP_URL") || "https://do-it-app.vercel.app";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "randomoranges.apps@gmail.com";
const FROM_NAME = "Happy";

const SYSTEM_PROMPT = `You are Happy, an AI accountability assistant for a personal to-do app called DoIt.

Personality:
- Friendly but real
- Casual, not corporate
- Witty, sometimes sarcastic
- Light roasting when deserved
- Never preachy or motivational-poster cringe

Rules:
- Keep emails short and punchy
- No fluff, no filler
- Use casual language, contractions, lowercase energy
- One emoji in subject line
- Sign off every email with "— Happy"
- Never use bullet points excessively
- Sound like a friend texting, not a productivity app

IMPORTANT: Always respond in valid JSON with exactly two keys: "subject" and "body". The body should be plain text (not HTML). Example:
{"subject": "📋 your monday lineup", "body": "hey...\\n\\n— Happy"}`;

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ============================================================
// GROK API
// ============================================================

async function callGrok(prompt: string, context: Record<string, unknown>): Promise<{ subject: string; body: string }> {
  const grokApiKey = Deno.env.get("GROK_API_KEY");
  if (!grokApiKey) throw new Error("GROK_API_KEY not set");

  const userMessage = `${prompt}\n\nContext data:\n${JSON.stringify(context, null, 2)}`;

  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${grokApiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.9,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(content);
    return { subject: parsed.subject, body: parsed.body };
  } catch {
    // Fallback: extract subject from first line, rest is body
    const lines = content.split("\n");
    return {
      subject: lines[0].replace(/^subject:\s*/i, "").trim(),
      body: lines.slice(1).join("\n").replace(/^body:\s*/i, "").trim(),
    };
  }
}

// ============================================================
// GMAIL API EMAIL
// ============================================================

async function getGmailAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth credentials not set (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)");
  }

  const response = await fetch(GMAIL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail token refresh failed: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

function buildMimeMessage(to: string, subject: string, body: string): string {
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="white-space: pre-line; font-size: 15px; line-height: 1.6;">
${body}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
        <a href="${APP_URL}" style="display: inline-block; padding: 10px 24px; background: #F59E0B; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Open DoIt</a>
      </div>
    </div>
  `.trim();

  const boundary = "boundary_" + Date.now();
  const mime = [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    `${body}\n\n---\nOpen DoIt: ${APP_URL}`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  return mime;
}

// Base64url encode (Gmail API requirement)
function base64urlEncode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let base64 = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const len = data.length;
  for (let i = 0; i < len; i += 3) {
    const a = data[i];
    const b = i + 1 < len ? data[i + 1] : 0;
    const c = i + 2 < len ? data[i + 2] : 0;
    base64 += chars[a >> 2];
    base64 += chars[((a & 3) << 4) | (b >> 4)];
    base64 += i + 1 < len ? chars[((b & 15) << 2) | (c >> 6)] : "=";
    base64 += i + 2 < len ? chars[c & 63] : "=";
  }
  // Convert to base64url
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    const accessToken = await getGmailAccessToken();
    const mime = buildMimeMessage(to, subject, body);
    const raw = base64urlEncode(mime);

    const response = await fetch(GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ raw }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Gmail send error: ${response.status} - ${err}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Gmail send failed:`, err);
    return false;
  }
}

// ============================================================
// DATA FETCHING
// ============================================================

interface UserContext {
  user_name: string;
  user_email: string;
  user_id: string;
  current_time: string;
  day_of_week: string;
  today_tasks: Array<{ task: string; checked: boolean; age_hours: number }>;
  tomorrow_tasks: string[];
  someday_tasks: string[];
  completed_today: number;
  pending_today: number;
  total_tasks_today: number;
  stale_tasks: Array<{ task: string; age_hours: number }>;
  last_app_open: string;
  days_inactive: number;
  wins_this_week: number;
  wins_total: number;
  timezone: string;
}

async function getUserContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  settings: { name: string; email: string; timezone: string }
): Promise<UserContext> {
  const now = new Date();
  const userTz = settings.timezone;

  // Fetch all tasks for both profiles
  const { data: allTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId);

  const tasks = allTasks || [];

  // Today's tasks
  const todayTasks = tasks.filter((t: Record<string, unknown>) => t.section === "today");
  const tomorrowTasks = tasks.filter((t: Record<string, unknown>) => t.section === "tomorrow");
  const somedayTasks = tasks.filter((t: Record<string, unknown>) => t.section === "someday");

  const todayFormatted = todayTasks.map((t: Record<string, unknown>) => ({
    task: t.title as string,
    checked: t.completed as boolean,
    age_hours: Math.round((now.getTime() - new Date(t.created_at as string).getTime()) / (1000 * 60 * 60)),
  }));

  const completedToday = todayTasks.filter((t: Record<string, unknown>) => t.completed).length;
  const pendingToday = todayTasks.filter((t: Record<string, unknown>) => !t.completed).length;

  // Stale tasks (24+ hours old, not completed)
  const staleTasks = todayFormatted.filter((t) => !t.checked && t.age_hours >= 24);

  // Wins this week
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: winsThisWeek } = await supabase
    .from("wins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", weekAgo.toISOString());

  // Total wins
  const { count: winsTotal } = await supabase
    .from("wins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Last app open
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("last_app_open")
    .eq("user_id", userId)
    .single();

  const lastOpen = userSettings?.last_app_open ? new Date(userSettings.last_app_open) : now;
  const daysInactive = Math.floor((now.getTime() - lastOpen.getTime()) / (1000 * 60 * 60 * 24));

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return {
    user_name: settings.name,
    user_email: settings.email,
    user_id: userId,
    current_time: now.toISOString(),
    day_of_week: days[now.getDay()],
    today_tasks: todayFormatted,
    tomorrow_tasks: tomorrowTasks.map((t: Record<string, unknown>) => t.title as string),
    someday_tasks: somedayTasks.map((t: Record<string, unknown>) => t.title as string),
    completed_today: completedToday,
    pending_today: pendingToday,
    total_tasks_today: todayTasks.length,
    stale_tasks: staleTasks,
    last_app_open: lastOpen.toISOString(),
    days_inactive: daysInactive,
    wins_this_week: winsThisWeek || 0,
    wins_total: winsTotal || 0,
    timezone: userTz,
  };
}

// ============================================================
// JOB PROMPTS
// ============================================================

function getMorningPrompt(ctx: UserContext): string | null {
  if (ctx.total_tasks_today === 0) {
    return `Job: Empty Today List

Context:
- Today's tasks: none
- Tomorrow's tasks: ${JSON.stringify(ctx.tomorrow_tasks)}
- Someday tasks: ${JSON.stringify(ctx.someday_tasks)}
- Day: ${ctx.day_of_week}

Task: User has nothing in their Today list. Write an email that checks in — did they forget to add tasks? Are they intentionally chilling? Mention they could pull something from Someday or plan for Tomorrow. Keep it light, not guilt-trippy. A little roast is okay.

Output: JSON with "subject" and "body" keys.`;
  }

  if (ctx.total_tasks_today >= 5) {
    return `Job: Planning Assist

Context:
- Today's tasks: ${JSON.stringify(ctx.today_tasks)}
- Total: ${ctx.total_tasks_today}
- Day: ${ctx.day_of_week}

Task: User has a lot on their plate. Write an email that acknowledges this, then suggest a logical order to tackle the tasks. Look for tasks that can be batched together. Add a witty comment. Don't be preachy about productivity.

Output: JSON with "subject" and "body" keys.`;
  }

  return `Job: Morning Briefing

Context:
- Today's tasks: ${JSON.stringify(ctx.today_tasks)}
- Total: ${ctx.total_tasks_today}
- Day: ${ctx.day_of_week}

Task: Write a short morning email listing today's tasks. Give one quick tip on where to start or how to approach the day. Keep it casual and energizing without being cheesy.

Output: JSON with "subject" and "body" keys.`;
}

function getMiddayPrompt(ctx: UserContext): string | null {
  if (ctx.pending_today === 0) return null; // Skip if nothing pending

  const pendingTasks = ctx.today_tasks.filter((t) => !t.checked);
  const oldest = pendingTasks.reduce((a, b) => (a.age_hours > b.age_hours ? a : b), pendingTasks[0]);

  return `Job: Midday Check-in

Context:
- Completed today: ${ctx.completed_today}
- Still pending: ${ctx.pending_today}
- Pending tasks: ${JSON.stringify(pendingTasks)}
- Oldest pending task: "${oldest.task}" (${oldest.age_hours} hours old)

Task: It's midday. Write a short check-in email about their progress. Mention what's done and what's left. If a task has been sitting for hours, call it out with a light roast. Nudge them to keep going.

Output: JSON with "subject" and "body" keys.`;
}

function getEveningPrompt(ctx: UserContext): string | null {
  if (ctx.total_tasks_today === 0) return null;

  const completed = ctx.today_tasks.filter((t) => t.checked);
  const pending = ctx.today_tasks.filter((t) => !t.checked);

  return `Job: End of Day Recap

Context:
- Completed: ${ctx.completed_today} tasks
- Missed/Pending: ${ctx.pending_today} tasks
- Completed list: ${JSON.stringify(completed.map((t) => t.task))}
- Pending list: ${JSON.stringify(pending.map((t) => t.task))}
- Day: ${ctx.day_of_week}

Task: Write an evening recap email. Summarize what got done and what didn't. If they crushed it, hype them up. If they slacked, call it out gently. Mention any carryover tasks. Keep it short, end on a "rest up" note.

Output: JSON with "subject" and "body" keys.`;
}

function getCelebrationPrompt(ctx: UserContext): string {
  const completed = ctx.today_tasks.filter((t) => t.checked);
  return `Job: All Tasks Done Celebration

Context:
- Tasks completed: ${ctx.completed_today}
- Tasks list: ${JSON.stringify(completed.map((t) => t.task))}
- Wins this week: ${ctx.wins_this_week}

Task: User completed everything in their Today list. Write a short hype email celebrating this. Keep it cool, not over-the-top. Maybe a light joke about them actually getting stuff done. Encourage them to chill now.

Output: JSON with "subject" and "body" keys.`;
}

function getStaleTaskPrompt(ctx: UserContext): string | null {
  if (ctx.stale_tasks.length === 0) return null;

  const main = ctx.stale_tasks[0];
  const others = ctx.stale_tasks.slice(1);
  const ageDays = Math.floor(main.age_hours / 24);

  return `Job: Stale Task Alert

Context:
- Stale task: "${main.task}"
- Age: ${main.age_hours} hours (${ageDays} days)
- Other stale tasks: ${JSON.stringify(others.map((t) => t.task))}

Task: This task has been sitting untouched for over a day. Write an email calling this out. Give options: do it, move it to someday, or delete it. Be real — if they keep avoiding it, maybe they don't actually want to do it. Roast them a little but keep it friendly.

Output: JSON with "subject" and "body" keys.`;
}

function getInactivityPrompt(ctx: UserContext): string | null {
  if (ctx.days_inactive < 2) return null;

  return `Job: Inactivity Ping

Context:
- Days since last app open: ${ctx.days_inactive}
- Pending tasks in Today: ${ctx.pending_today}
- Tasks list: ${JSON.stringify(ctx.today_tasks)}

Task: User has gone MIA. Write an email checking if they're alive. Mention their pending tasks are still waiting. Light guilt trip, friendly roast. Don't be aggressive, but nudge them to come back.

Output: JSON with "subject" and "body" keys.`;
}

function getFridayPrompt(ctx: UserContext): string {
  const pending = ctx.today_tasks.filter((t) => !t.checked);
  return `Job: Friday Wind Down

Context:
- Tasks completed this week: ${ctx.wins_this_week}
- Tasks still pending: ${ctx.pending_today}
- Pending list: ${JSON.stringify(pending.map((t) => t.task))}

Task: It's Friday evening. Write a week-closing email. Mention how many tasks they completed this week (or roast them if it's low). Tell them to take a break, ask if they have weekend plans or are winging it. Keep it casual and friendly — like a friend texting before the weekend.

Output: JSON with "subject" and "body" keys.`;
}

function getSundayPrompt(ctx: UserContext): string {
  return `Job: Weekly Life Check-in

Context:
- Week's wins: ${ctx.wins_this_week}
- Current pending: ${ctx.pending_today}
- Day: Sunday evening

Task: This is NOT about tasks. Write a life check-in email. Ask reflective questions — how are they actually doing, not just productivity-wise. What went well, what drained them, are they resting or just existing. Keep it thoughtful but casual. No action required. Like a friend checking in on their mental state.

Output: JSON with "subject" and "body" keys.`;
}

// ============================================================
// JOB EXECUTION
// ============================================================

function getUserLocalHour(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getUTCHours(); // fallback
  }
}

function getUserLocalDay(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: timezone,
    });
    const day = formatter.format(now);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[day] ?? now.getDay();
  } catch {
    return new Date().getDay();
  }
}

async function wasEmailSentToday(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobType: string,
  timezone: string
): Promise<boolean> {
  // Check if this job was already sent today in user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }); // YYYY-MM-DD format
  const todayStr = formatter.format(now);

  const { data } = await supabase
    .from("happy_email_log")
    .select("id")
    .eq("user_id", userId)
    .eq("job_type", jobType)
    .gte("sent_at", `${todayStr}T00:00:00Z`)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

async function logEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobType: string,
  subject: string
) {
  await supabase.from("happy_email_log").insert({
    user_id: userId,
    job_type: jobType,
    subject,
    sent_at: new Date().toISOString(),
  });
}

async function processJob(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  settings: { name: string; email: string; timezone: string },
  jobType: string,
  prompt: string
) {
  try {
    // Check if already sent today
    const alreadySent = await wasEmailSentToday(supabase, userId, jobType, settings.timezone);
    if (alreadySent) {
      console.log(`Skipping ${jobType} for ${userId} - already sent today`);
      return;
    }

    const ctx = await getUserContext(supabase, userId, settings);
    const { subject, body } = await callGrok(prompt, ctx);

    const sent = await sendEmail(settings.email, subject, body);
    if (sent) {
      await logEmail(supabase, userId, jobType, subject);
      console.log(`Sent ${jobType} to ${settings.email}`);
    }
  } catch (err) {
    console.error(`Error processing ${jobType} for ${userId}:`, err);
  }
}

async function handleScheduledJob(supabase: ReturnType<typeof createClient>, jobType: string) {
  // Get all users with Happy enabled
  const { data: users, error } = await supabase
    .from("happy_settings")
    .select("*")
    .eq("enabled", true);

  if (error || !users?.length) {
    console.log("No Happy users found or error:", error?.message);
    return;
  }

  for (const user of users) {
    const tz = user.timezone || "America/New_York";
    const hour = getUserLocalHour(tz);
    const day = getUserLocalDay(tz);
    const ctx = await getUserContext(supabase, user.user_id, {
      name: user.name,
      email: user.email,
      timezone: tz,
    });

    if (jobType === "morning" && hour === 8) {
      const prompt = getMorningPrompt(ctx);
      if (prompt) await processJob(supabase, user.user_id, user, "morning", prompt);
    }

    if (jobType === "midday" && hour === 14) {
      const prompt = getMiddayPrompt(ctx);
      // Edge case: skip midday if all tasks done (celebration instead)
      if (prompt && ctx.pending_today > 0) {
        await processJob(supabase, user.user_id, user, "midday", prompt);
      }
    }

    if (jobType === "evening" && hour === 20) {
      const prompt = getEveningPrompt(ctx);
      if (prompt) await processJob(supabase, user.user_id, user, "evening", prompt);
    }

    if (jobType === "friday" && day === 5 && hour === 18) {
      const prompt = getFridayPrompt(ctx);
      await processJob(supabase, user.user_id, user, "friday", prompt);
    }

    if (jobType === "sunday" && day === 0 && hour === 19) {
      const prompt = getSundayPrompt(ctx);
      await processJob(supabase, user.user_id, user, "sunday", prompt);
    }

    if (jobType === "hourly_check") {
      // Stale task alert (once per day max)
      const stalePrompt = getStaleTaskPrompt(ctx);
      if (stalePrompt) {
        await processJob(supabase, user.user_id, user, "stale_task", stalePrompt);
      }

      // Inactivity ping (once per day max)
      const inactivityPrompt = getInactivityPrompt(ctx);
      if (inactivityPrompt) {
        await processJob(supabase, user.user_id, user, "inactivity", inactivityPrompt);
      }
    }
  }
}

async function handleEventTrigger(
  supabase: ReturnType<typeof createClient>,
  jobType: string,
  userId: string
) {
  const { data: settings } = await supabase
    .from("happy_settings")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true)
    .single();

  if (!settings) return;

  const ctx = await getUserContext(supabase, userId, {
    name: settings.name,
    email: settings.email,
    timezone: settings.timezone || "America/New_York",
  });

  if (jobType === "celebration") {
    // Only trigger if truly all done
    if (ctx.pending_today === 0 && ctx.completed_today > 0) {
      const prompt = getCelebrationPrompt(ctx);
      await processJob(supabase, userId, settings, "celebration", prompt);
    }
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { job_type, user_id } = body;

    console.log(`Happy job received: ${job_type}${user_id ? ` for user ${user_id}` : ""}`);

    if (user_id) {
      // Event-triggered (from frontend)
      await handleEventTrigger(supabase, job_type, user_id);
    } else {
      // Scheduled (from cron)
      await handleScheduledJob(supabase, job_type);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Happy function error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
