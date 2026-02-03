import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Settings, ArrowLeft, Check, Trash2, X, Sun, Moon, Monitor, LogOut, User } from "lucide-react";
import confetti from "canvas-confetti";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Google OAuth configuration
const GOOGLE_OAUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/google";
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

// Theme configurations - CORRECTED arrangement
const THEMES = {
  yellow: {
    name: "Yellow",
    color: "#F59E0B",
    today: { image: "/emojis/bee.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/lemon.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/sunflower.png", label: "someday", placeholder: "someday I will..." },
  },
  gold: {
    name: "Gold",
    color: "#D97706",
    today: { image: "/emojis/green-beer.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/gold-tumbler.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/gold-clinking.png", label: "someday", placeholder: "someday I will..." },
  },
  green: {
    name: "Green",
    color: "#16A34A",
    today: { image: "/emojis/gold-shamrock.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/green-plant.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/green-tree.png", label: "someday", placeholder: "someday I will..." },
  },
  red: {
    name: "Red",
    color: "#DC2626",
    today: { image: "/emojis/red-rose.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/red-wine.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/red-heart.png", label: "someday", placeholder: "someday I will..." },
  },
  violet: {
    name: "Violet",
    color: "#7C3AED",
    today: { image: "/emojis/violet-ok.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/violet-shrug.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/violet-pregnant.png", label: "someday", placeholder: "someday I will..." },
  },
  blue: {
    name: "Blue",
    color: "#2563EB",
    today: { image: "/emojis/blue-butterfly.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/blue-thunder.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/blue-wave.png", label: "someday", placeholder: "someday I will..." },
  },
  white: {
    name: "White",
    color: "#9CA3AF",
    today: { image: "/emojis/white-chart.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/white-down.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/white-up.png", label: "someday", placeholder: "someday I will..." },
  },
  pink: {
    name: "Pink",
    color: "#EC4899",
    today: { image: "/emojis/pink-blossom.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/pink-purse.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/pink-heart.png", label: "someday", placeholder: "someday I will..." },
  },
  brown: {
    name: "Brown",
    color: "#92400E",
    today: { image: "/emojis/brown-dog.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/brown-pretzel.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/brown-coffee.png", label: "someday", placeholder: "someday I will..." },
  },
  healthy: {
    name: "Healthy Eating",
    color: "#84CC16",
    today: { image: "/emojis/healthy-banana.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/healthy-cherry.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/healthy-milk.png", label: "someday", placeholder: "someday I will..." },
  },
  gym: {
    name: "Gym Bro",
    color: "#EF4444",
    today: { image: "/emojis/gym-lift.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/gym-flex.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/gym-eggplant.png", label: "someday", placeholder: "someday I will..." },
  },
  farm: {
    name: "Farm Life",
    color: "#F97316",
    today: { image: "/emojis/farm-rooster.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/farm-egg.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/farm-cooking.png", label: "someday", placeholder: "someday I will..." },
  },
  money: {
    name: "Money",
    color: "#22C55E",
    today: { image: "/emojis/money-flying.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/money-dollar.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/money-face.png", label: "someday", placeholder: "someday I will..." },
  },
};

const COLOR_THEMES = ["yellow", "gold", "green", "red", "violet", "blue", "white", "pink", "brown"];
const SPECIAL_THEMES = ["healthy", "gym", "farm", "money"];

const getSectionConfig = (theme, section) => {
  return THEMES[theme]?.[section] || THEMES.yellow[section];
};

// Dark mode detection
const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#F97316', '#0D9488', '#3D3229', '#FFD700', '#FF69B4']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#F97316', '#0D9488', '#3D3229', '#FFD700', '#FF69B4']
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

// Custom Bottom Sheet
const BottomSheet = ({ open, onClose, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        {children}
      </div>
    </div>
  );
};

// Settings Modal
const SettingsModal = ({ 
  open, 
  onClose, 
  currentTheme, 
  onThemeChange, 
  darkMode, 
  onDarkModeChange,
  currentProfile,
  onProfileChange,
  user,
  isGuest,
  onLogout
}) => {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose} data-testid="close-settings">
            <X size={24} />
          </button>
        </div>
        
        <div className="settings-body">
          {/* User Info Section */}
          {user && !isGuest && (
            <div className="settings-section user-section">
              <div className="user-info">
                {user.picture && (
                  <img src={user.picture} alt={user.name} className="user-avatar" />
                )}
                <div className="user-details">
                  <p className="user-name">{user.name}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          
          {isGuest && (
            <div className="settings-section user-section">
              <div className="user-info guest">
                <div className="guest-avatar">
                  <User size={24} />
                </div>
                <div className="user-details">
                  <p className="user-name">Guest Mode</p>
                  <p className="user-email">Tasks saved locally</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Section */}
          <div className="settings-section">
            <p className="settings-section-label">Profile</p>
            <div className="profile-toggle">
              <button 
                className={`profile-toggle-btn ${currentProfile === 'personal' ? 'active' : ''}`}
                onClick={() => onProfileChange('personal')}
                data-testid="profile-toggle-personal"
              >
                <div className="profile-indicator personal" />
                <span>Personal</span>
              </button>
              <button 
                className={`profile-toggle-btn ${currentProfile === 'work' ? 'active' : ''}`}
                onClick={() => onProfileChange('work')}
                data-testid="profile-toggle-work"
              >
                <div className="profile-indicator work" />
                <span>Work</span>
              </button>
            </div>
          </div>

          {/* Dark Mode Section */}
          <div className="settings-section">
            <p className="settings-section-label">Appearance</p>
            <div className="appearance-toggle">
              <button 
                className={`appearance-btn ${darkMode === 'auto' ? 'active' : ''}`}
                onClick={() => onDarkModeChange('auto')}
                data-testid="theme-auto"
              >
                <Monitor size={18} />
                <span>Auto</span>
              </button>
              <button 
                className={`appearance-btn ${darkMode === 'light' ? 'active' : ''}`}
                onClick={() => onDarkModeChange('light')}
                data-testid="theme-light"
              >
                <Sun size={18} />
                <span>Light</span>
              </button>
              <button 
                className={`appearance-btn ${darkMode === 'dark' ? 'active' : ''}`}
                onClick={() => onDarkModeChange('dark')}
                data-testid="theme-dark"
              >
                <Moon size={18} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Color Themes Section */}
          <div className="settings-section">
            <p className="settings-section-label">Colors</p>
            <div className="theme-grid">
              {COLOR_THEMES.map((themeKey) => {
                const theme = THEMES[themeKey];
                const isActive = currentTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    className={`theme-option ${isActive ? 'active' : ''}`}
                    onClick={() => onThemeChange(themeKey)}
                    data-testid={`theme-${themeKey}`}
                  >
                    <div className="theme-preview">
                      <img src={theme.today.image} alt="" className="theme-emoji" />
                      <img src={theme.tomorrow.image} alt="" className="theme-emoji" />
                      <img src={theme.someday.image} alt="" className="theme-emoji" />
                    </div>
                    <span className="theme-dot" style={{ backgroundColor: theme.color }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Themes */}
          <div className="settings-section">
            <p className="settings-section-label">Other themes</p>
            <div className="special-themes-list">
              {SPECIAL_THEMES.map((themeKey) => {
                const theme = THEMES[themeKey];
                const isActive = currentTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    className={`special-theme-option ${isActive ? 'active' : ''}`}
                    onClick={() => onThemeChange(themeKey)}
                    data-testid={`theme-${themeKey}`}
                  >
                    <div className="special-theme-preview">
                      <img src={theme.today.image} alt="" className="special-theme-emoji" />
                      <img src={theme.tomorrow.image} alt="" className="special-theme-emoji" />
                      <img src={theme.someday.image} alt="" className="special-theme-emoji" />
                    </div>
                    <span className="special-theme-name">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Logout Section */}
          <div className="settings-section logout-section">
            <button 
              className="logout-btn" 
              onClick={onLogout}
              data-testid="logout-btn"
            >
              <LogOut size={18} />
              <span>{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login Screen
const LoginScreen = ({ onGoogleLogin, onGuestMode, isLoading }) => {
  return (
    <div className="login-screen" data-testid="login-screen">
      <div className="login-content">
        <h1 className="login-title">can-do</h1>
        <p className="login-tagline">
          One task at a time,
          <br />
          you've got this.
        </p>
      </div>
      
      <div className="login-buttons">
        <button 
          className="google-login-btn" 
          onClick={onGoogleLogin}
          disabled={isLoading}
          data-testid="google-login-btn"
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
        
        <button 
          className="guest-mode-btn" 
          onClick={onGuestMode}
          disabled={isLoading}
          data-testid="guest-mode-btn"
        >
          <User size={20} />
          <span>Continue as Guest</span>
        </button>
      </div>
      
      <p className="login-hint">Guest mode saves tasks locally on this device</p>
    </div>
  );
};

// Landing Screen (Profile Selection)
const LandingScreen = ({ onSelectProfile, userName }) => {
  return (
    <div className="landing-screen" data-testid="landing-screen">
      <div className="landing-content">
        {userName && (
          <p className="welcome-text">Welcome back, {userName.split(' ')[0]}!</p>
        )}
        <p className="landing-tagline">
          One task at a time,
          <br />
          you've got this.
        </p>
      </div>
      
      <div className="profile-selector">
        <div
          className="profile-option"
          onClick={() => onSelectProfile("personal")}
          data-testid="profile-personal-btn"
        >
          <div className="profile-indicator personal" />
          <span className="profile-name">Personal</span>
        </div>
        
        <div
          className="profile-option"
          onClick={() => onSelectProfile("work")}
          data-testid="profile-work-btn"
        >
          <div className="profile-indicator work" />
          <span className="profile-name">Work</span>
        </div>
      </div>
    </div>
  );
};

// Section Card
const SectionCard = ({ section, taskCount, onClick, theme }) => {
  const config = getSectionConfig(theme, section);
  
  return (
    <div className="section-card" onClick={onClick} data-testid={`section-card-${section}`}>
      <img src={config.image} alt={config.label} className="section-emoji-img" />
      <div className="section-info">
        <h2 className="section-title">{config.label}</h2>
        <span className="task-count-badge" data-testid={`count-${section}`}>{taskCount}</span>
      </div>
    </div>
  );
};

// Profile Screen
const ProfileScreen = ({ profile, tasks, onBack, onSelectSection, onOpenSettings, theme }) => {
  const profileLabel = profile.charAt(0).toUpperCase() + profile.slice(1);
  const getTaskCount = (section) => tasks.filter((t) => t.section === section && !t.completed).length;

  return (
    <div className="profile-screen" data-testid="profile-screen">
      <div className="screen-header">
        <h1 className="header-title">{profileLabel}</h1>
        <button className="settings-btn" onClick={onOpenSettings} data-testid="settings-btn">
          <Settings size={28} strokeWidth={1.5} />
        </button>
      </div>

      <div className="sections-container">
        {["today", "tomorrow", "someday"].map((section) => (
          <SectionCard
            key={section}
            section={section}
            taskCount={getTaskCount(section)}
            onClick={() => onSelectSection(section)}
            theme={theme}
          />
        ))}
      </div>

      <div className="screen-footer">
        <button className="back-btn" onClick={onBack} data-testid="back-btn">
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <button className="fab" onClick={() => onSelectSection("today")} data-testid="add-task-fab">
          <img src="/emojis/writing-hand.png" alt="Add task" className="fab-emoji" />
        </button>
      </div>
    </div>
  );
};

// Task Item
const TaskItem = ({ task, onToggle, onEdit }) => {
  const parseTaskContent = (text) => {
    const lines = text.split('\n');
    const mainTitle = lines[0];
    const subtasks = lines.slice(1).filter(line => 
      line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•')
    ).map(line => line.trim().replace(/^[-*•]\s*/, ''));
    return { mainTitle, subtasks };
  };

  const { mainTitle, subtasks } = parseTaskContent(task.title);

  return (
    <div className="task-item" onClick={() => onEdit(task)} data-testid={`task-item-${task.id}`}>
      <div className="task-content">
        <span className={`task-title ${task.completed ? "completed" : ""}`}>{mainTitle}</span>
        {subtasks.length > 0 && (
          <div className="task-subtasks">
            {subtasks.map((subtask, index) => (
              <div key={index} className="subtask-item">
                <div className={`subtask-checkbox ${task.completed ? "checked" : ""}`}>
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={`subtask-title ${task.completed ? "completed" : ""}`}>{subtask}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className={`task-checkbox ${task.completed ? "checked" : ""}`}
        onClick={(e) => { e.stopPropagation(); onToggle(task); }}
        data-testid={`task-checkbox-${task.id}`}
      >
        {task.completed && <Check size={16} strokeWidth={3} />}
      </div>
    </div>
  );
};

// Empty State
const EmptyState = ({ section, onAddClick, theme }) => {
  const config = getSectionConfig(theme, section);
  const emptyTexts = {
    today: { text: "No tasks for today", hint: "tap + to add one" },
    tomorrow: { text: "Nothing planned for tomorrow", hint: "tap + to add something" },
    someday: { text: "No someday tasks yet", hint: "tap + to dream big" },
  };
  
  return (
    <div className="empty-state" onClick={onAddClick} data-testid="empty-state">
      <img src={config.image} alt={config.label} className="empty-state-emoji" />
      <p className="empty-state-text">{emptyTexts[section].text}</p>
      <p className="empty-state-hint">{emptyTexts[section].hint}</p>
    </div>
  );
};

// Section Screen
const SectionScreen = ({ 
  profile, section, tasks, onBack, onToggleTask, onEditTask, onAddTask, onClearCompleted, theme
}) => {
  const config = getSectionConfig(theme, section);
  const sectionTasks = tasks.filter((t) => t.section === section);
  const incompleteTasks = sectionTasks.filter((t) => !t.completed);
  const completedTasks = sectionTasks.filter((t) => t.completed);
  const taskCount = incompleteTasks.length;
  const allTasksCompleted = sectionTasks.length > 0 && incompleteTasks.length === 0;
  const hasNoTasks = sectionTasks.length === 0;

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  
  useEffect(() => {
    if (allTasksCompleted && !hasShownConfetti && completedTasks.length > 0) {
      triggerConfetti();
      setHasShownConfetti(true);
    }
  }, [allTasksCompleted, hasShownConfetti, completedTasks.length]);

  useEffect(() => {
    if (!allTasksCompleted) setHasShownConfetti(false);
  }, [allTasksCompleted]);
  
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (diff > 100) onBack();
    setTouchStart(null);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), section);
      setNewTaskTitle("");
      setAddDrawerOpen(false);
    }
  };

  return (
    <div 
      className="section-screen" 
      data-testid={`section-screen-${section}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="section-header-detail">
        <img 
          src={config.image} 
          alt={config.label} 
          className="section-header-emoji"
          onClick={onBack}
          data-testid="section-back-btn"
        />
        <div className="section-header-info">
          <h1 className="section-header-title">{config.label}</h1>
          <span className="section-header-count">{taskCount}</span>
        </div>
      </div>

      {hasNoTasks ? (
        <EmptyState section={section} onAddClick={() => setAddDrawerOpen(true)} theme={theme} />
      ) : (
        <div className="task-list">
          {incompleteTasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={onToggleTask} onEdit={onEditTask} />
          ))}
          {completedTasks.length > 0 && (
            <div className="completed-section">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={onToggleTask} onEdit={onEditTask} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="screen-footer">
        <div className="footer-actions-bubble">
          <button className="footer-action-btn" onClick={onBack} data-testid="footer-back-btn">
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <button 
            className="footer-action-btn" 
            onClick={() => onClearCompleted(section)} 
            data-testid="clear-completed-btn"
            disabled={completedTasks.length === 0}
          >
            <span className="clear-icon">T̶x̶</span>
          </button>
        </div>
        <button className="fab" onClick={() => setAddDrawerOpen(true)} data-testid="section-add-fab">
          <img src="/emojis/writing-hand.png" alt="Add task" className="fab-emoji" />
        </button>
      </div>

      <BottomSheet open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)}>
        <div className="add-sheet-body">
          <textarea
            className="add-task-input"
            placeholder={config.placeholder}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            autoFocus
            rows={3}
            data-testid="add-task-input"
          />
          <p className="add-task-hint">Use - at start of line for subtasks</p>
          <div className="add-drawer-footer">
            <button
              className="newline-btn"
              onClick={() => setNewTaskTitle(prev => prev + '\n- ')}
              type="button"
              data-testid="add-subtask-btn"
            >
              + subtask
            </button>
            <button
              className="add-task-btn"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              data-testid="add-task-submit-btn"
            >
              add
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

// Edit Task Drawer
const EditTaskDrawer = ({ open, onClose, task, onUpdate, onDelete, theme }) => {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("today");
  const [taskId, setTaskId] = useState(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSection(task.section);
      setTaskId(task.id);
    }
  }, [task]);

  const handleSave = () => {
    if (title.trim() && taskId) {
      onUpdate(taskId, { title: title.trim(), section });
      onClose();
    }
  };

  const handleDelete = () => {
    if (taskId) {
      onDelete(taskId);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="edit-drawer-body" data-testid="edit-task-drawer">
        <textarea
          className="edit-task-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={3}
          data-testid="edit-task-input"
        />
        
        <div className="section-selector">
          {["today", "tomorrow", "someday"].map((key) => {
            const config = getSectionConfig(theme, key);
            return (
              <button
                key={key}
                className={`section-pill ${section === key ? "active" : ""}`}
                onClick={() => setSection(key)}
                data-testid={`edit-section-pill-${key}`}
              >
                <img src={config.image} alt={config.label} className="pill-emoji" />
                <span>{config.label}</span>
              </button>
            );
          })}
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!title.trim()}
            data-testid="save-task-btn"
          >
            save
          </button>
        </div>
        
        <div className="action-buttons">
          <button className="action-btn" onClick={onClose} data-testid="back-action-btn">
            <ArrowLeft size={22} />
          </button>
          <button className="action-btn delete" onClick={handleDelete} data-testid="delete-task-btn">
            <Trash2 size={22} />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

// Main App
function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('taskTheme') || 'yellow');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') || 'auto');

  // Apply dark mode
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (darkMode === 'auto') {
        isDark = getSystemTheme() === 'dark';
      } else {
        isDark = darkMode === 'dark';
      }
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (darkMode === 'auto') applyTheme();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [darkMode]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('taskTheme', theme);
  };

  const handleDarkModeChange = (mode) => {
    setDarkMode(mode);
    localStorage.setItem('darkMode', mode);
  };

  const handleProfileChangeInSettings = (profile) => {
    if (profile !== currentProfile) {
      setCurrentProfile(profile);
      setCurrentSection(null);
    }
  };

  const fetchTasks = useCallback(async (profile) => {
    if (!profile) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/tasks/${profile}`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentProfile) {
      fetchTasks(currentProfile);
    }
  }, [currentProfile, fetchTasks]);

  const handleAddTask = async (title, section) => {
    try {
      const response = await axios.post(`${API}/tasks`, {
        title,
        profile: currentProfile,
        section,
      });
      setTasks([...tasks, response.data]);
      toast.success("Task added!");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const response = await axios.patch(`${API}/tasks/${task.id}`, {
        completed: !task.completed,
      });
      setTasks(tasks.map((t) => (t.id === task.id ? response.data : t)));
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await axios.patch(`${API}/tasks/${taskId}`, updates);
      setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
      toast.success("Task updated!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast.success("Task deleted!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleClearCompleted = async (section) => {
    const completedTasks = tasks.filter((t) => t.section === section && t.completed);
    try {
      await Promise.all(completedTasks.map((t) => axios.delete(`${API}/tasks/${t.id}`)));
      setTasks(tasks.filter((t) => !(t.section === section && t.completed)));
      toast.success("Completed tasks cleared!");
    } catch (error) {
      console.error("Error clearing tasks:", error);
      toast.error("Failed to clear tasks");
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditDrawerOpen(true);
  };

  const handleBackFromSection = () => setCurrentSection(null);
  const handleBackFromProfile = () => {
    setCurrentProfile(null);
    setCurrentSection(null);
    setTasks([]);
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Toaster position="top-center" richColors />
      
      {!currentProfile ? (
        <LandingScreen onSelectProfile={setCurrentProfile} />
      ) : currentSection ? (
        <SectionScreen
          profile={currentProfile}
          section={currentSection}
          tasks={tasks}
          onBack={handleBackFromSection}
          onToggleTask={handleToggleTask}
          onEditTask={handleEditTask}
          onAddTask={handleAddTask}
          onClearCompleted={handleClearCompleted}
          theme={currentTheme}
        />
      ) : (
        <ProfileScreen
          profile={currentProfile}
          tasks={tasks}
          onBack={handleBackFromProfile}
          onSelectSection={setCurrentSection}
          onOpenSettings={() => setSettingsOpen(true)}
          theme={currentTheme}
        />
      )}

      <EditTaskDrawer
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingTask(null); }}
        task={editingTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        theme={currentTheme}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        darkMode={darkMode}
        onDarkModeChange={handleDarkModeChange}
        currentProfile={currentProfile}
        onProfileChange={handleProfileChangeInSettings}
      />
    </div>
  );
}

export default App;
