# Stylish Tasks - To-Do App PRD

## Original Problem Statement
Build a simple CRUD to-do app with specific mobile-first design as per user's design screenshots.

## User Personas
- General users wanting a simple, beautiful to-do app
- Users who prefer minimal, clean interfaces
- Mobile-first users

## Core Requirements (Static)
- Two profiles: Personal and Work
- Three time sections: today, tomorrow, later
- Apple emojis for sections (🐝, 🍋, 🌻)
- Light/minimal aesthetic with soft grays and white
- CRUD operations for tasks
- Task completion toggle
- Move tasks between sections

## What's Been Implemented (January 24, 2026)

### Backend (FastAPI)
- `GET /api/tasks/{profile}` - Get all tasks for a profile
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/{task_id}` - Update task (title, section, completed)
- `DELETE /api/tasks/{task_id}` - Delete a task
- MongoDB persistence with proper models

### Frontend (React)
- Landing screen with motivational text and profile selection
- Tasks screen with three sections (today/tomorrow/later)
- Add task drawer with section selection
- Edit task drawer with update/delete options
- Task completion toggle with visual feedback
- Mobile-first responsive design (max-width: 430px)
- Shadcn Drawer component for bottom sheets
- Sonner for toast notifications

## Design System
- Fonts: Manrope (headings), Inter (body)
- Colors: Gray backgrounds (#F9FAFB), White cards, Black badges
- Profile accents: Orange (#F97316) for Personal, Teal (#0D9488) for Work
- Rounded corners throughout (1rem - 1.5rem)

## Prioritized Backlog
### P0 (Completed)
- [x] CRUD operations
- [x] Profile switching
- [x] Section management

### P1 (Future)
- [ ] Dark mode toggle
- [ ] Task due dates with calendar
- [ ] Task priorities
- [ ] Data persistence with user accounts

### P2 (Nice to have)
- [ ] Drag-and-drop reordering
- [ ] Task notes/descriptions
- [ ] Task sharing
- [ ] Push notifications

## Next Tasks
1. Add keyboard shortcuts for power users
2. Add swipe gestures for mobile (swipe left to delete)
3. Consider adding task statistics/analytics
