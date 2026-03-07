import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// CONFIG
// ============================================================

const GROK_RESPONSES_URL = "https://api.x.ai/v1/responses";
const GROK_MODEL = "grok-4-1-fast-reasoning";
const GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const APP_URL = Deno.env.get("APP_URL") || "https://do-it-app.vercel.app";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "randomoranges.apps@gmail.com";
const FROM_NAME = "Happy";

const SYSTEM_PROMPT = `You are Happy, an AI accountability assistant for a personal to-do app called DoIt.

The app has two profiles: Personal (for life stuff) and Work (for job stuff). When tasks span both profiles, always organize your email by profile so the user knows what's where.

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
- Sign off every email with "— Happy"
- Never use bullet points excessively
- Sound like a friend texting, not a productivity app
- When tasks exist in both profiles, show them grouped (e.g. "personal: ..., work: ...") — don't just dump a flat list
- If you spot optimization opportunities (tasks that can be batched, one profile being overloaded, tasks that should be moved), mention it briefly — 1-2 sentences, not a productivity lecture
- If user's location is provided and weather info is available, weave in a brief weather mention naturally (e.g. "it's gonna rain so maybe knock out indoor tasks first" or "nice day out, don't waste it staring at your screen all day")
- Never make weather the main topic — it's a side note, not a weather report

IMPORTANT: Always respond in valid JSON with exactly two keys: "subject" and "body". The body should be plain text (not HTML). Example:
{"subject": "your monday lineup", "body": "hey...\\n\\n— Happy"}`;

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
// GROK API (Responses endpoint with web search)
// ============================================================

async function callGrok(prompt: string, context: UserContext | Record<string, unknown>, useSearch = false): Promise<{ subject: string; body: string }> {
  const grokApiKey = Deno.env.get("GROK_API_KEY");
  if (!grokApiKey) throw new Error("GROK_API_KEY not set");

  const userMessage = `${prompt}\n\nContext data:\n${JSON.stringify(context, null, 2)}`;

  const requestBody: Record<string, unknown> = {
    model: GROK_MODEL,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.9,
    max_output_tokens: 500,
  };

  // Enable web search for weather/location-aware emails
  if (useSearch) {
    requestBody.tools = [{ type: "web_search" }];
  }

  const response = await fetch(GROK_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${grokApiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${err}`);
  }

  const data = await response.json();

  // Responses API returns output array — find the text message
  let content = "";
  if (data.output) {
    for (const item of data.output) {
      if (item.type === "message" && item.content) {
        for (const block of item.content) {
          if (block.type === "output_text") {
            content = block.text?.trim() || "";
          }
        }
      }
    }
  }

  if (!content) {
    throw new Error("No content in Grok response");
  }

  // Strip markdown code fences if present
  content = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    const parsed = JSON.parse(content);
    return { subject: parsed.subject, body: parsed.body };
  } catch {
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

interface TaskItem {
  task: string;
  checked: boolean;
  age_hours: number;
  profile: string;
}

interface ProfileTasks {
  today: TaskItem[];
  tomorrow: string[];
  someday: string[];
  completed_today: number;
  pending_today: number;
  total_today: number;
  stale: Array<{ task: string; age_hours: number }>;
}

interface UserContext {
  user_name: string;
  user_email: string;
  user_id: string;
  current_time: string;
  day_of_week: string;
  location: string;
  // All tasks (flat, for backward compat)
  today_tasks: TaskItem[];
  tomorrow_tasks: string[];
  someday_tasks: string[];
  completed_today: number;
  pending_today: number;
  total_tasks_today: number;
  stale_tasks: Array<{ task: string; age_hours: number }>;
  // Profile-separated tasks
  personal: ProfileTasks;
  work: ProfileTasks;
  has_both_profiles: boolean;
  last_app_open: string;
  days_inactive: number;
  wins_this_week: number;
  wins_total: number;
  timezone: string;
}

function buildProfileTasks(tasks: Record<string, unknown>[], profile: string, now: Date): ProfileTasks {
  const profileTasks = tasks.filter((t) => t.profile === profile);
  const today = profileTasks.filter((t) => t.section === "today");
  const tomorrow = profileTasks.filter((t) => t.section === "tomorrow");
  const someday = profileTasks.filter((t) => t.section === "someday");

  const todayFormatted = today.map((t) => ({
    task: t.title as string,
    checked: t.completed as boolean,
    age_hours: Math.round((now.getTime() - new Date(t.created_at as string).getTime()) / (1000 * 60 * 60)),
    profile,
  }));

  return {
    today: todayFormatted,
    tomorrow: tomorrow.map((t) => t.title as string),
    someday: someday.map((t) => t.title as string),
    completed_today: today.filter((t) => t.completed).length,
    pending_today: today.filter((t) => !t.completed).length,
    total_today: today.length,
    stale: todayFormatted.filter((t) => !t.checked && t.age_hours >= 24),
  };
}

async function getUserContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  settings: { name: string; email: string; timezone: string; location?: string }
): Promise<UserContext> {
  const now = new Date();

  const { data: allTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId);

  const tasks = allTasks || [];

  // Build profile-separated data
  const personal = buildProfileTasks(tasks, "personal", now);
  const work = buildProfileTasks(tasks, "work", now);
  const hasBoth = personal.total_today + work.total_today > 0 &&
    personal.total_today > 0 && work.total_today > 0;

  // Flat lists (all profiles combined)
  const todayTasks = tasks.filter((t: Record<string, unknown>) => t.section === "today");
  const tomorrowTasks = tasks.filter((t: Record<string, unknown>) => t.section === "tomorrow");
  const somedayTasks = tasks.filter((t: Record<string, unknown>) => t.section === "someday");

  const todayFormatted = todayTasks.map((t: Record<string, unknown>) => ({
    task: t.title as string,
    checked: t.completed as boolean,
    age_hours: Math.round((now.getTime() - new Date(t.created_at as string).getTime()) / (1000 * 60 * 60)),
    profile: (t.profile as string) || "personal",
  }));

  const completedToday = todayTasks.filter((t: Record<string, unknown>) => t.completed).length;
  const pendingToday = todayTasks.filter((t: Record<string, unknown>) => !t.completed).length;
  const staleTasks = todayFormatted.filter((t) => !t.checked && t.age_hours >= 24);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: winsThisWeek } = await supabase
    .from("wins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", weekAgo.toISOString());

  const { count: winsTotal } = await supabase
    .from("wins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

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
    location: settings.location || "",
    today_tasks: todayFormatted,
    tomorrow_tasks: tomorrowTasks.map((t: Record<string, unknown>) => t.title as string),
    someday_tasks: somedayTasks.map((t: Record<string, unknown>) => t.title as string),
    completed_today: completedToday,
    pending_today: pendingToday,
    total_tasks_today: todayTasks.length,
    stale_tasks: staleTasks,
    personal,
    work,
    has_both_profiles: hasBoth,
    last_app_open: lastOpen.toISOString(),
    days_inactive: daysInactive,
    wins_this_week: winsThisWeek || 0,
    wins_total: winsTotal || 0,
    timezone: settings.timezone,
  };
}

// ============================================================
// LOCATION/WEATHER CONTEXT HELPER
// ============================================================

function getLocationContext(ctx: UserContext): string {
  if (!ctx.location) return "";
  return `\n- User's location: ${ctx.location} (use web search to check current weather there and weave it in naturally if relevant — don't make it the focus, just a brief aside)`;
}

// ============================================================
// JOB PROMPTS (Profile-aware with optimization suggestions)
// ============================================================

function formatProfileSection(ctx: UserContext): string {
  const sections: string[] = [];

  if (ctx.personal.total_today > 0 || ctx.personal.tomorrow.length > 0) {
    sections.push(`[Personal]
  Today (${ctx.personal.total_today}): ${JSON.stringify(ctx.personal.today.map(t => ({ task: t.task, done: t.checked })))}
  Tomorrow: ${JSON.stringify(ctx.personal.tomorrow)}
  Someday: ${JSON.stringify(ctx.personal.someday)}
  Done: ${ctx.personal.completed_today}/${ctx.personal.total_today}`);
  }

  if (ctx.work.total_today > 0 || ctx.work.tomorrow.length > 0) {
    sections.push(`[Work]
  Today (${ctx.work.total_today}): ${JSON.stringify(ctx.work.today.map(t => ({ task: t.task, done: t.checked })))}
  Tomorrow: ${JSON.stringify(ctx.work.tomorrow)}
  Someday: ${JSON.stringify(ctx.work.someday)}
  Done: ${ctx.work.completed_today}/${ctx.work.total_today}`);
  }

  if (sections.length === 0) return "- No tasks in any profile";
  return sections.join("\n\n");
}

function getProfileOptimizationHint(ctx: UserContext): string {
  if (!ctx.has_both_profiles) return "";
  return `
Optimization guidance (weave these naturally, don't list them as bullet points):
- If personal and work tasks overlap in theme (e.g. emails, errands, calls), suggest batching them together
- If one profile is heavy and the other is light, suggest tackling the lighter one first for momentum
- If work tasks are time-sensitive, suggest front-loading those
- Note any tasks that could be moved to tomorrow or someday to reduce overload
- Keep optimization suggestions brief and conversational — 1-2 sentences max, not a lecture`;
}

function getMorningPrompt(ctx: UserContext): string | null {
  const loc = getLocationContext(ctx);

  if (ctx.total_tasks_today === 0) {
    return `Job: Empty Today List

Context:
- Day: ${ctx.day_of_week}
${formatProfileSection(ctx)}${loc}

Task: User has nothing in their Today list across both profiles. Write an email that checks in — did they forget to add tasks? Are they intentionally chilling? If they have tasks in Tomorrow or Someday, mention they could pull something over. Keep it light, not guilt-trippy. A little roast is okay. If they have tasks in one profile but not the other, note that.

Output: JSON with "subject" and "body" keys.`;
  }

  if (ctx.total_tasks_today >= 5) {
    return `Job: Planning Assist

Context:
- Day: ${ctx.day_of_week}
- Total tasks today: ${ctx.total_tasks_today}
${formatProfileSection(ctx)}${loc}
${getProfileOptimizationHint(ctx)}

Task: User has a lot on their plate. Write an email that shows tasks grouped by profile (personal vs work). Suggest a smart order to tackle them — look for tasks that can be batched across profiles (e.g. all emails at once, all errands together). If one profile is overloaded, suggest moving lower-priority items to tomorrow. Add a witty comment. Don't be preachy.

Output: JSON with "subject" and "body" keys.`;
  }

  return `Job: Morning Briefing

Context:
- Day: ${ctx.day_of_week}
- Total tasks today: ${ctx.total_tasks_today}
${formatProfileSection(ctx)}${loc}
${getProfileOptimizationHint(ctx)}

Task: Write a short morning email showing today's tasks organized by profile (personal/work). Give one quick tip on where to start or what to tackle first. If they have tasks in both profiles, briefly suggest an efficient order. Keep it casual and energizing.

Output: JSON with "subject" and "body" keys.`;
}

function getMiddayPrompt(ctx: UserContext): string | null {
  if (ctx.pending_today === 0) return null;
  const loc = getLocationContext(ctx);

  const personalPending = ctx.personal.today.filter(t => !t.checked);
  const workPending = ctx.work.today.filter(t => !t.checked);
  const allPending = ctx.today_tasks.filter((t) => !t.checked);
  const oldest = allPending.reduce((a, b) => (a.age_hours > b.age_hours ? a : b), allPending[0]);

  return `Job: Midday Check-in

Context:
- Overall: ${ctx.completed_today} done, ${ctx.pending_today} remaining
- Personal pending (${personalPending.length}): ${JSON.stringify(personalPending.map(t => t.task))}
- Work pending (${workPending.length}): ${JSON.stringify(workPending.map(t => t.task))}
- Personal done: ${ctx.personal.completed_today}/${ctx.personal.total_today}
- Work done: ${ctx.work.completed_today}/${ctx.work.total_today}
- Oldest pending: "${oldest.task}" [${oldest.profile}] (${oldest.age_hours}h old)${loc}
${getProfileOptimizationHint(ctx)}

Task: Midday check-in. Show progress per profile — which profile is ahead, which is lagging. If a task has been sitting for hours, call it out with a light roast (mention which profile it's in). If one profile is done but the other isn't, acknowledge the win and nudge on the rest. Suggest any quick wins they can knock out.

Output: JSON with "subject" and "body" keys.`;
}

function getEveningPrompt(ctx: UserContext): string | null {
  if (ctx.total_tasks_today === 0) return null;

  const personalCompleted = ctx.personal.today.filter(t => t.checked).map(t => t.task);
  const personalPending = ctx.personal.today.filter(t => !t.checked).map(t => t.task);
  const workCompleted = ctx.work.today.filter(t => t.checked).map(t => t.task);
  const workPending = ctx.work.today.filter(t => !t.checked).map(t => t.task);

  return `Job: End of Day Recap

Context:
- Day: ${ctx.day_of_week}
- Overall: ${ctx.completed_today} completed, ${ctx.pending_today} missed

[Personal] ${ctx.personal.completed_today}/${ctx.personal.total_today} done
  Completed: ${JSON.stringify(personalCompleted)}
  Missed: ${JSON.stringify(personalPending)}

[Work] ${ctx.work.completed_today}/${ctx.work.total_today} done
  Completed: ${JSON.stringify(workCompleted)}
  Missed: ${JSON.stringify(workPending)}

Task: Write an evening recap showing results per profile. Which profile got more done? If they crushed one but not the other, note it. If missed tasks in one profile could be moved to someday, suggest it. Keep it short. End on a "rest up" note. If everything is done, just celebrate.

Output: JSON with "subject" and "body" keys.`;
}

function getCelebrationPrompt(ctx: UserContext): string {
  const personalDone = ctx.personal.today.filter(t => t.checked).map(t => t.task);
  const workDone = ctx.work.today.filter(t => t.checked).map(t => t.task);

  return `Job: All Tasks Done Celebration

Context:
- Total completed: ${ctx.completed_today}
- Personal tasks done: ${JSON.stringify(personalDone)}
- Work tasks done: ${JSON.stringify(workDone)}
- Wins this week: ${ctx.wins_this_week}

Task: User completed everything across both profiles. Write a short hype email. If they had tasks in both personal and work, acknowledge they handled both sides of their life. Keep it cool, not over-the-top. Maybe a light joke. Encourage them to chill now.

Output: JSON with "subject" and "body" keys.`;
}

function getStaleTaskPrompt(ctx: UserContext): string | null {
  if (ctx.stale_tasks.length === 0) return null;

  // Group stale tasks by profile
  const personalStale = ctx.personal.stale;
  const workStale = ctx.work.stale;
  const main = ctx.stale_tasks[0];
  const mainProfile = ctx.today_tasks.find(t => t.task === main.task)?.profile || "unknown";
  const ageDays = Math.floor(main.age_hours / 24);

  return `Job: Stale Task Alert

Context:
- Oldest stale task: "${main.task}" [${mainProfile}] — ${main.age_hours}h (${ageDays} days)
- Personal stale tasks: ${JSON.stringify(personalStale.map(t => t.task))}
- Work stale tasks: ${JSON.stringify(workStale.map(t => t.task))}

Task: These tasks have been sitting untouched. Write an email calling out the worst offender (mention which profile it's in). If stale tasks are spread across profiles, note the pattern. Give options: do it now, move to someday, or just delete it. If they keep avoiding it, maybe they don't actually want to do it. Roast gently.

Output: JSON with "subject" and "body" keys.`;
}

function getInactivityPrompt(ctx: UserContext): string | null {
  if (ctx.days_inactive < 2) return null;

  return `Job: Inactivity Ping

Context:
- Days since last app open: ${ctx.days_inactive}
- Personal pending: ${ctx.personal.pending_today} tasks (${JSON.stringify(ctx.personal.today.filter(t => !t.checked).map(t => t.task))})
- Work pending: ${ctx.work.pending_today} tasks (${JSON.stringify(ctx.work.today.filter(t => !t.checked).map(t => t.task))})
- Total pending: ${ctx.pending_today}

Task: User has gone MIA. Write an email checking if they're alive. Mention tasks are piling up across their profiles. If work tasks are waiting, add urgency. If personal tasks are waiting, be more chill about it. Light guilt trip, friendly roast. Don't be aggressive.

Output: JSON with "subject" and "body" keys.`;
}

function getFridayPrompt(ctx: UserContext): string {
  const loc = getLocationContext(ctx);
  const personalPending = ctx.personal.today.filter(t => !t.checked).map(t => t.task);
  const workPending = ctx.work.today.filter(t => !t.checked).map(t => t.task);

  return `Job: Friday Wind Down

Context:
- Tasks completed this week: ${ctx.wins_this_week}
- Personal still pending: ${JSON.stringify(personalPending)}
- Work still pending: ${JSON.stringify(workPending)}
- Total pending: ${ctx.pending_today}${loc}

Task: It's Friday evening. Write a week-closing email. Mention how many tasks they got done this week. If work tasks are still pending, ask if they can wait till Monday or need to be handled. If personal tasks remain, suggest tackling them over the weekend or moving them. Keep it casual, like a friend texting before the weekend.

Output: JSON with "subject" and "body" keys.`;
}

function getSundayPrompt(ctx: UserContext): string {
  const loc = getLocationContext(ctx);
  return `Job: Weekly Life Check-in

Context:
- Week's wins: ${ctx.wins_this_week}
- Personal pending: ${ctx.personal.pending_today}
- Work pending: ${ctx.work.pending_today}
- Day: Sunday evening${loc}

Task: This is NOT about tasks. Write a life check-in email. Ask reflective questions — how are they actually doing, not just productivity-wise. If they've been heavy on work tasks all week, ask if they're making time for personal stuff. If personal tasks are piling up, ask if they're okay. What went well, what drained them. Keep it thoughtful but casual. Like a friend checking in.

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
    return new Date().getUTCHours();
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
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
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

// Determine if this job should use web search (for weather)
function shouldUseSearch(jobType: string, location: string): boolean {
  if (!location) return false;
  // Use search for morning, midday, friday, sunday — where weather is relevant
  return ["morning", "midday", "friday", "sunday"].includes(jobType);
}

async function processJob(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  settings: { name: string; email: string; timezone: string; location?: string },
  jobType: string,
  prompt: string
) {
  try {
    const alreadySent = await wasEmailSentToday(supabase, userId, jobType, settings.timezone);
    if (alreadySent) {
      console.log(`Skipping ${jobType} for ${userId} - already sent today`);
      return;
    }

    const ctx = await getUserContext(supabase, userId, settings);
    const useSearch = shouldUseSearch(jobType, ctx.location);
    const { subject, body } = await callGrok(prompt, ctx, useSearch);

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
  const { data: users, error } = await supabase
    .from("happy_settings")
    .select("*")
    .eq("enabled", true);

  if (error || !users?.length) {
    console.log("No Happy users found or error:", error?.message);
    return;
  }

  for (const user of users) {
    const tz = (user.timezone as string) || "America/New_York";
    const hour = getUserLocalHour(tz);
    const day = getUserLocalDay(tz);
    const settingsObj = {
      name: user.name,
      email: user.email,
      timezone: tz,
      location: user.location || "",
    };
    const ctx = await getUserContext(supabase, user.user_id, settingsObj);

    if (jobType === "morning" && hour === 8) {
      const prompt = getMorningPrompt(ctx);
      if (prompt) await processJob(supabase, user.user_id, settingsObj, "morning", prompt);
    }

    if (jobType === "midday" && hour === 14) {
      const prompt = getMiddayPrompt(ctx);
      if (prompt && ctx.pending_today > 0) {
        await processJob(supabase, user.user_id, settingsObj, "midday", prompt);
      }
    }

    if (jobType === "evening" && hour === 20) {
      const prompt = getEveningPrompt(ctx);
      if (prompt) await processJob(supabase, user.user_id, settingsObj, "evening", prompt);
    }

    if (jobType === "friday" && day === 5 && hour === 18) {
      const prompt = getFridayPrompt(ctx);
      await processJob(supabase, user.user_id, settingsObj, "friday", prompt);
    }

    if (jobType === "sunday" && day === 0 && hour === 19) {
      const prompt = getSundayPrompt(ctx);
      await processJob(supabase, user.user_id, settingsObj, "sunday", prompt);
    }

    if (jobType === "hourly_check") {
      const stalePrompt = getStaleTaskPrompt(ctx);
      if (stalePrompt) {
        await processJob(supabase, user.user_id, settingsObj, "stale_task", stalePrompt);
      }

      const inactivityPrompt = getInactivityPrompt(ctx);
      if (inactivityPrompt) {
        await processJob(supabase, user.user_id, settingsObj, "inactivity", inactivityPrompt);
      }
    }
  }
}

async function handleEventTrigger(
  supabase: ReturnType<typeof createClient>,
  jobType: string,
  userId: string,
  force = false
) {
  const { data: settings } = await supabase
    .from("happy_settings")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true)
    .single();

  if (!settings) return;

  const settingsObj = {
    name: settings.name,
    email: settings.email,
    timezone: settings.timezone || "America/New_York",
    location: settings.location || "",
  };
  const ctx = await getUserContext(supabase, userId, settingsObj);

  if (jobType === "celebration") {
    if (ctx.pending_today === 0 && ctx.completed_today > 0) {
      const prompt = getCelebrationPrompt(ctx);
      await processJob(supabase, userId, settingsObj, "celebration", prompt);
    }
    return;
  }

  // When called with user_id (event trigger / force test), bypass hour/day gates
  // and run the requested job type directly
  let prompt: string | null = null;
  switch (jobType) {
    case "morning":
    case "test_morning":
      prompt = getMorningPrompt(ctx);
      if (prompt) await processJob(supabase, userId, settingsObj, "morning", prompt);
      break;
    case "midday":
      prompt = getMiddayPrompt(ctx);
      if (prompt) await processJob(supabase, userId, settingsObj, "midday", prompt);
      break;
    case "evening":
      prompt = getEveningPrompt(ctx);
      if (prompt) await processJob(supabase, userId, settingsObj, "evening", prompt);
      break;
    case "friday":
      prompt = getFridayPrompt(ctx);
      await processJob(supabase, userId, settingsObj, "friday", prompt);
      break;
    case "sunday":
      prompt = getSundayPrompt(ctx);
      await processJob(supabase, userId, settingsObj, "sunday", prompt);
      break;
    case "hourly_check": {
      const stalePrompt = getStaleTaskPrompt(ctx);
      if (stalePrompt) await processJob(supabase, userId, settingsObj, "stale_task", stalePrompt);
      const inactivityPrompt = getInactivityPrompt(ctx);
      if (inactivityPrompt) await processJob(supabase, userId, settingsObj, "inactivity", inactivityPrompt);
      break;
    }
  }
}

// ============================================================
// MIDNIGHT TASK ROLLOVER
// ============================================================

async function handleMidnightRollover(supabase: ReturnType<typeof createClient>) {
  // Get ALL users (not just Happy-enabled — task rollover should work for everyone)
  const { data: allUsers, error } = await supabase.auth.admin.listUsers();
  if (error || !allUsers?.users?.length) {
    console.log("No users found for rollover:", error?.message);
    return;
  }

  // Also get timezone info from happy_settings for users who have it
  const { data: happyUsers } = await supabase
    .from("happy_settings")
    .select("user_id, timezone");
  const tzMap = new Map((happyUsers || []).map((u: Record<string, string>) => [u.user_id, u.timezone]));

  for (const user of allUsers.users) {
    const tz = (tzMap.get(user.id) as string) || "America/New_York";
    const hour = getUserLocalHour(tz);

    // Only rollover if it's midnight (0) in user's timezone
    if (hour !== 0) continue;

    const { data: tomorrowTasks, error: fetchErr } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("section", "tomorrow")
      .eq("completed", false);

    if (fetchErr || !tomorrowTasks?.length) continue;

    const ids = tomorrowTasks.map((t: Record<string, string>) => t.id);
    const { error: updateErr } = await supabase
      .from("tasks")
      .update({ section: "today", updated_at: new Date().toISOString() })
      .in("id", ids);

    if (!updateErr) {
      console.log(`Rolled over ${ids.length} tomorrow→today tasks for user ${user.id}`);
    } else {
      console.error(`Rollover error for ${user.id}:`, updateErr.message);
    }
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { job_type, user_id, force } = body;

    console.log(`Happy job received: ${job_type}${user_id ? ` for user ${user_id}` : ""}${force ? " (forced)" : ""}`);

    if (job_type === "midnight_rollover") {
      await handleMidnightRollover(supabase);
    } else if (user_id) {
      await handleEventTrigger(supabase, job_type, user_id, !!force);
    } else {
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
