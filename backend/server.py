from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, timezone
from supabase import create_client, Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://hyjkrbnsftuouaitbdkr.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

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
