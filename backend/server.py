from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="can-do API")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    theme: str = "yellow"
    dark_mode: str = "auto"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    profile: Literal["personal", "work"]
    section: Literal["today", "tomorrow", "someday"]
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    profile: Literal["personal", "work"]
    section: Literal["today", "tomorrow", "someday"] = "today"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    section: Optional[Literal["today", "tomorrow", "someday"]] = None
    completed: Optional[bool] = None

class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    dark_mode: Optional[str] = None

class SessionRequest(BaseModel):
    session_id: str

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token (cookie or header)"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# Guest user helper
def get_guest_user_id(request: Request) -> str:
    """Get or create guest user ID from cookie"""
    guest_id = request.cookies.get("guest_id")
    if not guest_id:
        guest_id = f"guest_{uuid.uuid4().hex[:12]}"
    return guest_id

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def create_session(session_req: SessionRequest, response: Response):
    """Exchange session_id for session_token after Google OAuth"""
    try:
        # Call Emergent auth API to get user data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_req.session_id}
            )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one(
            {"email": auth_data["email"]},
            {"_id": 0}
        )
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user info
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": auth_data["name"],
                    "picture": auth_data.get("picture"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": auth_data["email"],
                "name": auth_data["name"],
                "picture": auth_data.get("picture"),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Create default settings for new user
            await db.user_settings.insert_one({
                "user_id": user_id,
                "theme": "yellow",
                "dark_mode": "auto",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Create session
        session_token = auth_data.get("session_token", f"session_{uuid.uuid4().hex}")
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Get user doc
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return user_doc
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}

# ==================== SETTINGS ENDPOINTS ====================

@api_router.get("/settings")
async def get_settings(request: Request):
    """Get user settings"""
    user = await get_current_user(request)
    
    if user:
        settings = await db.user_settings.find_one(
            {"user_id": user.user_id},
            {"_id": 0}
        )
        if not settings:
            settings = {"user_id": user.user_id, "theme": "yellow", "dark_mode": "auto"}
        return settings
    else:
        # Guest - return from cookie or defaults
        return {
            "user_id": "guest",
            "theme": "yellow",
            "dark_mode": "auto"
        }

@api_router.patch("/settings")
async def update_settings(input: SettingsUpdate, request: Request):
    """Update user settings"""
    user = await get_current_user(request)
    
    if not user:
        # Guest users save settings in localStorage (handled by frontend)
        return {"message": "Settings saved locally for guest"}
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.user_settings.update_one(
        {"user_id": user.user_id},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.user_settings.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    return settings

# ==================== TASK ENDPOINTS ====================

@api_router.get("/tasks/{profile}")
async def get_tasks(profile: Literal["personal", "work"], request: Request):
    """Get tasks for a profile"""
    user = await get_current_user(request)
    
    if user:
        user_id = user.user_id
    else:
        user_id = get_guest_user_id(request)
    
    tasks = await db.tasks.find(
        {"user_id": user_id, "profile": profile},
        {"_id": 0}
    ).to_list(1000)
    
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if isinstance(task.get('updated_at'), str):
            task['updated_at'] = datetime.fromisoformat(task['updated_at'])
    
    return tasks

@api_router.post("/tasks")
async def create_task(input: TaskCreate, request: Request, response: Response):
    """Create a new task"""
    user = await get_current_user(request)
    
    if user:
        user_id = user.user_id
    else:
        user_id = get_guest_user_id(request)
        # Set guest cookie if not exists
        if not request.cookies.get("guest_id"):
            response.set_cookie(
                key="guest_id",
                value=user_id,
                httponly=True,
                secure=True,
                samesite="none",
                path="/",
                max_age=365 * 24 * 60 * 60  # 1 year
            )
    
    task = Task(user_id=user_id, **input.model_dump())
    doc = task.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.tasks.insert_one(doc)
    
    return task

@api_router.patch("/tasks/{task_id}")
async def update_task(task_id: str, input: TaskUpdate, request: Request):
    """Update a task"""
    user = await get_current_user(request)
    
    if user:
        user_id = user.user_id
    else:
        user_id = get_guest_user_id(request)
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tasks.find_one_and_update(
        {"id": task_id, "user_id": user_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    
    result.pop('_id', None)
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    if isinstance(result.get('updated_at'), str):
        result['updated_at'] = datetime.fromisoformat(result['updated_at'])
    
    return result

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, request: Request):
    """Delete a task"""
    user = await get_current_user(request)
    
    if user:
        user_id = user.user_id
    else:
        user_id = get_guest_user_id(request)
    
    result = await db.tasks.delete_one({"id": task_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "can-do API", "status": "running"}

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
