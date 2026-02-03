# can-do - To-Do App PRD

## Original Problem Statement
Build a mobile-first CRUD to-do app named "can-do" with specific design requirements:
- Two profiles: Personal and Work
- Three sections per profile: Today, Tomorrow, Someday
- Support for sub-tasks (indicated by `-` prefix)
- 13 emoji themes (9 colors + 4 special)
- Dark mode (Auto/Light/Dark)
- Google Sign-In via Emergent Auth
- Guest Mode with local storage
- Confetti animation on task completion

## User Personas
- General users wanting a simple, beautiful to-do app
- Users who prefer minimal, clean interfaces
- Mobile-first users
- Users who want quick access without signing up (Guest Mode)

## Core Requirements
- Two profiles: Personal and Work
- Three time sections: today, tomorrow, someday
- Emoji themes (bee/lemon/sunflower for default yellow theme)
- Light/Dark mode support
- CRUD operations for tasks
- Task completion toggle with confetti
- Move tasks between sections
- Sub-task support using `-` prefix
- Google OAuth authentication
- Guest mode with localStorage persistence

## What's Been Implemented (February 3, 2026)

### Backend (FastAPI)
- `GET /api/` - Health check
- `POST /api/auth/session` - Exchange OAuth session_id for session_token
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update user settings
- `GET /api/tasks/{profile}` - Get all tasks for a profile
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/{task_id}` - Update task
- `DELETE /api/tasks/{task_id}` - Delete a task
- MongoDB persistence with proper models
- User, UserSettings, Task, UserSession collections

### Frontend (React)
- **Login Screen**: Google Sign-In button, Guest Mode button
- **Landing Screen**: Profile selection (Personal/Work) with welcome text
- **Profile Screen**: Section cards (today/tomorrow/someday) with task counts
- **Section Screen**: Task list with empty state, add task FAB
- **Settings Modal**: User info, profile toggle, appearance (Auto/Light/Dark), color themes (9), special themes (4), logout button
- **Task Management**: Add, edit, toggle complete, delete tasks
- **Sub-task Support**: Parse and display sub-tasks from task title
- **Confetti Animation**: Fires when all tasks in section completed
- **Custom Bottom Sheet**: Mobile-friendly task input
- **Theme Engine**: 13 emoji themes with CSS variables
- **Dark Mode**: Auto/Light/Dark with system preference detection
- **Guest Mode**: Full CRUD with localStorage persistence

### Authentication Flow
1. User clicks "Continue with Google"
2. Redirects to `https://auth.emergentagent.com/?redirect={origin}`
3. After Google auth, returns to `{origin}#session_id=xxx`
4. Frontend detects session_id in URL hash
5. Calls `POST /api/auth/session` with session_id
6. Backend exchanges with Emergent API, creates user/session
7. Returns user data + session_token
8. Frontend stores token in localStorage

### Guest Mode Flow
1. User clicks "Continue as Guest"
2. Sets `isGuest=true` in localStorage
3. All task CRUD operations use localStorage
4. Settings also stored locally
5. "Exit Guest Mode" returns to login screen

## Design System
- Font: League Spartan
- Colors: Soft gray backgrounds, white cards
- Profile accents: Orange (#F97316) Personal, Teal (#0D9488) Work
- Dark mode: Full CSS variable theming
- Rounded corners throughout

## Tech Stack
- Backend: FastAPI, MongoDB, httpx
- Frontend: React 19, Axios, Lucide React, canvas-confetti
- Auth: Emergent Google OAuth
- Styling: CSS with CSS Variables

## Files Structure
```
/app
├── backend/
│   ├── server.py       # FastAPI app with auth and task endpoints
│   └── .env            # MONGO_URL, DB_NAME
├── frontend/
│   ├── public/
│   │   ├── index.html  # App title "can-do", removed Emergent badge
│   │   └── emojis/     # All theme emoji images
│   ├── src/
│   │   ├── App.js      # Main app with auth, components, state
│   │   ├── App.css     # All styles including dark mode
│   │   └── index.css   # Global styles, CSS variables
│   └── package.json    # name: "can-do"
└── memory/
    └── PRD.md          # This file
```

## Completed Tasks
- [x] Mobile-first UI with custom design
- [x] Two profiles (Personal/Work)
- [x] Three sections (today/tomorrow/someday)
- [x] 13 emoji themes (9 color + 4 special)
- [x] Dark mode (Auto/Light/Dark)
- [x] Settings modal with all options
- [x] Sub-task support
- [x] Confetti on completion
- [x] Google OAuth integration (Emergent Auth)
- [x] Guest Mode with localStorage
- [x] Login/Logout flow
- [x] Remove "Made with Emergent" badge
- [x] Rename app to "can-do"

## Known Issues
- Lint warnings for setState in useEffect (confetti, edit drawer) - functional but not optimized

## Future Enhancements (Backlog)
- [ ] Refactor App.js into smaller components
- [ ] Add task due dates
- [ ] Task reminders/notifications
- [ ] Drag and drop to reorder tasks
- [ ] Export/import tasks
- [ ] Task search/filter
