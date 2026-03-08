from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode, quote
from supabase import create_client, Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://hyjkrbnsftuouaitbdkr.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Google Calendar OAuth config
GCAL_CLIENT_ID = os.environ.get('GCAL_CLIENT_ID', '')
GCAL_CLIENT_SECRET = os.environ.get('GCAL_CLIENT_SECRET', '')
GCAL_REDIRECT_URI = os.environ.get('GCAL_REDIRECT_URI', 'http://localhost:8000/api/gcal/callback')
GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

app = FastAPI(title="DoIt API")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class TaskCreate(BaseModel):
    title: str
    profile: Literal["personal", "work"]
    section: Literal["today", "tomorrow", "someday"] = "today"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    section: Optional[Literal["today", "tomorrow", "someday"]] = None
    completed: Optional[bool] = None

class WinCreate(BaseModel):
    task: str
    completed_at: Optional[str] = None

class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    dark_mode: Optional[str] = None

# ==================== AUTH HELPERS ====================

def get_user_id_from_token(request: Request) -> str:
    """Extract and verify user from Supabase JWT in Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]

    try:
        # Use Supabase to verify the token and get user
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def get_supabase_client_for_user(request: Request) -> Client:
    """Create a Supabase client authenticated as the user (for RLS)"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = auth_header.split(" ")[1]

    # Create a new client with the user's token for RLS
    user_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    user_client.postgrest.auth(token)
    return user_client

# ==================== AUTH ENDPOINTS ====================

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user info from Supabase JWT"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = user_response.user
        return {
            "user_id": user.id,
            "email": user.email,
            "name": user.user_metadata.get("full_name", user.user_metadata.get("name", "")),
            "picture": user.user_metadata.get("avatar_url", user.user_metadata.get("picture", "")),
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# ==================== SETTINGS ENDPOINTS ====================

@api_router.get("/settings")
async def get_settings(request: Request):
    """Get user settings"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    result = client.table("user_settings").select("*").eq("user_id", user_id).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]

    # Create default settings if none exist
    default_settings = {
        "user_id": user_id,
        "theme": "yellow",
        "dark_mode": "auto",
    }
    client.table("user_settings").insert(default_settings).execute()
    return default_settings

@api_router.patch("/settings")
async def update_settings(input: SettingsUpdate, request: Request):
    """Update user settings"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = client.table("user_settings").update(update_data).eq("user_id", user_id).execute()

    if not result.data:
        # Upsert if no settings exist yet
        update_data["user_id"] = user_id
        result = client.table("user_settings").insert(update_data).execute()

    return result.data[0] if result.data else update_data

# ==================== TASK ENDPOINTS ====================

@api_router.get("/tasks/{profile}")
async def get_tasks(profile: Literal["personal", "work"], request: Request):
    """Get tasks for a profile"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    result = client.table("tasks").select("*").eq("user_id", user_id).eq("profile", profile).order("created_at").execute()
    return result.data

@api_router.post("/tasks")
async def create_task(input: TaskCreate, request: Request):
    """Create a new task"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    task_data = {
        "user_id": user_id,
        "title": input.title,
        "profile": input.profile,
        "section": input.section,
        "completed": False,
    }

    result = client.table("tasks").insert(task_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create task")

    return result.data[0]

@api_router.patch("/tasks/{task_id}")
async def update_task(task_id: str, input: TaskUpdate, request: Request):
    """Update a task"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = client.table("tasks").update(update_data).eq("id", task_id).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return result.data[0]

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, request: Request):
    """Delete a task"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    result = client.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted successfully"}

# ==================== WINS ENDPOINTS ====================

@api_router.get("/wins")
async def get_wins(request: Request):
    """Get all wins for the user"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    result = client.table("wins").select("*").eq("user_id", user_id).order("completed_at", desc=True).execute()
    return result.data

@api_router.post("/wins")
async def create_win(input: WinCreate, request: Request):
    """Record a win (completed task)"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    win_data = {
        "user_id": user_id,
        "task": input.task,
        "completed_at": input.completed_at or datetime.now(timezone.utc).isoformat(),
    }

    result = client.table("wins").insert(win_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to record win")

    return result.data[0]

# ==================== GOOGLE CALENDAR ENDPOINTS ====================

@api_router.get("/gcal/connect/{profile}")
async def gcal_connect(profile: Literal["personal", "work"], request: Request):
    """Start Google Calendar OAuth flow for a profile"""
    user_id = get_user_id_from_token(request)

    # Store user_id and profile in state param for the callback
    state = f"{user_id}:{profile}"
    params = {
        "client_id": GCAL_CLIENT_ID,
        "redirect_uri": GCAL_REDIRECT_URI,
        "response_type": "code",
        "scope": GCAL_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}

@api_router.get("/gcal/callback")
async def gcal_callback(code: str = None, state: str = None, error: str = None):
    """Handle Google Calendar OAuth callback"""
    if error:
        return RedirectResponse(f"{FRONTEND_URL}?gcal_error={error}")

    if not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}?gcal_error=missing_params")

    try:
        user_id, profile = state.split(":", 1)
    except ValueError:
        return RedirectResponse(f"{FRONTEND_URL}?gcal_error=invalid_state")

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GCAL_CLIENT_ID,
                "client_secret": GCAL_CLIENT_SECRET,
                "redirect_uri": GCAL_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if token_resp.status_code != 200:
        return RedirectResponse(f"{FRONTEND_URL}?gcal_error=token_exchange_failed")

    tokens = token_resp.json()
    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token", "")
    expires_in = tokens.get("expires_in", 3600)
    token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # Get the Google email for this account
    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    google_email = ""
    if userinfo_resp.status_code == 200:
        google_email = userinfo_resp.json().get("email", "")

    # Use service role to upsert (we don't have the user's JWT here in callback)
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if service_key:
        admin_client = create_client(SUPABASE_URL, service_key)
    else:
        admin_client = supabase

    # Upsert calendar account
    admin_client.table("google_calendar_accounts").upsert(
        {
            "user_id": user_id,
            "profile": profile,
            "google_email": google_email,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_expires_at": token_expires_at.isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id,profile",
    ).execute()

    return RedirectResponse(f"{FRONTEND_URL}?gcal_connected={profile}")

@api_router.delete("/gcal/{profile}")
async def gcal_disconnect(profile: Literal["personal", "work"], request: Request):
    """Disconnect Google Calendar for a profile"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    client.table("google_calendar_accounts").delete().eq(
        "user_id", user_id
    ).eq("profile", profile).execute()

    return {"message": f"Google Calendar disconnected for {profile}"}

@api_router.get("/gcal/accounts")
async def gcal_accounts(request: Request):
    """Get connected Google Calendar accounts"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    result = client.table("google_calendar_accounts").select(
        "id, profile, google_email, created_at"
    ).eq("user_id", user_id).execute()

    return result.data or []

async def refresh_gcal_token(account: dict) -> str:
    """Refresh an expired Google Calendar access token"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GCAL_CLIENT_ID,
                "client_secret": GCAL_CLIENT_SECRET,
                "refresh_token": account["refresh_token"],
                "grant_type": "refresh_token",
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to refresh Google token")

    tokens = resp.json()
    new_access_token = tokens["access_token"]
    expires_in = tokens.get("expires_in", 3600)
    new_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # Update token in database using service role
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if service_key:
        admin_client = create_client(SUPABASE_URL, service_key)
    else:
        admin_client = supabase

    admin_client.table("google_calendar_accounts").update({
        "access_token": new_access_token,
        "token_expires_at": new_expires_at.isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", account["id"]).execute()

    return new_access_token

async def get_valid_access_token(account: dict) -> str:
    """Get a valid access token, refreshing if expired"""
    expires_at = datetime.fromisoformat(account["token_expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) >= expires_at - timedelta(minutes=5):
        return await refresh_gcal_token(account)
    return account["access_token"]

@api_router.get("/gcal/events/{profile}")
async def gcal_events(
    profile: Literal["personal", "work"],
    request: Request,
    period: Literal["today", "tomorrow"] = "today",
):
    """Get Google Calendar events for today or tomorrow"""
    user_id = get_user_id_from_token(request)
    client = get_supabase_client_for_user(request)

    # Get the calendar account for this profile
    result = client.table("google_calendar_accounts").select("*").eq(
        "user_id", user_id
    ).eq("profile", profile).single().execute()

    if not result.data:
        return []

    account = result.data
    access_token = await get_valid_access_token(account)

    # Determine time range based on period
    # Use user's timezone from happy_settings if available
    tz_result = client.table("happy_settings").select("timezone").eq(
        "user_id", user_id
    ).single().execute()
    user_tz = tz_result.data.get("timezone", "UTC") if tz_result.data else "UTC"

    # Calculate time boundaries in user's timezone so "today" means the user's today
    try:
        import zoneinfo
        user_zone = zoneinfo.ZoneInfo(user_tz)
    except Exception:
        user_zone = timezone.utc
    now_local = datetime.now(user_zone)
    today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "today":
        time_min = today_start
        time_max = today_start + timedelta(days=1)
    else:  # tomorrow
        time_min = today_start + timedelta(days=1)
        time_max = today_start + timedelta(days=2)

    # Fetch events from Google Calendar API
    calendar_id = account.get('calendar_id') or 'primary'
    params = {
        "timeMin": time_min.isoformat(),
        "timeMax": time_max.isoformat(),
        "singleEvents": "true",
        "orderBy": "startTime",
        "maxResults": "50",
        "timeZone": user_tz,
    }

    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            f"https://www.googleapis.com/calendar/v3/calendars/{quote(calendar_id, safe='')}/events",
            params=params,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch calendar events")

    data = resp.json()
    events = []
    for item in data.get("items", []):
        # Determine event type
        event_type = "event"
        if item.get("eventType") == "focusTime":
            event_type = "focus_time"
        elif item.get("eventType") == "outOfOffice":
            event_type = "out_of_office"
        elif item.get("transparency") == "transparent":
            event_type = "reminder"

        # Parse start/end times
        start = item.get("start", {})
        end = item.get("end", {})

        events.append({
            "id": item.get("id"),
            "title": item.get("summary", "(No title)"),
            "description": item.get("description", ""),
            "start": start.get("dateTime") or start.get("date", ""),
            "end": end.get("dateTime") or end.get("date", ""),
            "all_day": "date" in start and "dateTime" not in start,
            "type": event_type,
            "location": item.get("location", ""),
            "status": item.get("status", "confirmed"),
            "calendar_profile": profile,
        })

    return events

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "DoIt API", "status": "running"}

# ==================== APP SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
