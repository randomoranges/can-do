import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Settings, ArrowLeft, Check, Trash2, X } from "lucide-react";
import confetti from "canvas-confetti";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme configurations with emoji images
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
    today: { image: "/emojis/gold-tumbler.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/gold-shamrock.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/gold-rose.png", label: "someday", placeholder: "someday I will..." },
  },
  green: {
    name: "Green",
    color: "#16A34A",
    today: { image: "/emojis/green-beer.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/green-plant.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/green-wine.png", label: "someday", placeholder: "someday I will..." },
  },
  red: {
    name: "Red",
    color: "#DC2626",
    today: { image: "/emojis/red-heart.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/red-wine.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/red-rose.png", label: "someday", placeholder: "someday I will..." },
  },
  violet: {
    name: "Violet",
    color: "#7C3AED",
    today: { image: "/emojis/violet-ok.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/violet-raise.png", label: "tomorrow", placeholder: "tomorrow I will..." },
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
    tomorrow: { image: "/emojis/pink-perfume.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/pink-hearts.png", label: "someday", placeholder: "someday I will..." },
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

// Color themes (basic colors)
const COLOR_THEMES = ["yellow", "gold", "green", "red", "violet", "blue", "white", "pink", "brown"];
// Special themes
const SPECIAL_THEMES = ["healthy", "gym", "farm", "money"];

// Get section config based on current theme
const getSectionConfig = (theme, section) => {
  return THEMES[theme]?.[section] || THEMES.yellow[section];
};

// Confetti celebration
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

// Custom Bottom Sheet for mobile
const BottomSheet = ({ open, onClose, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div 
        className="bottom-sheet-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet-handle" />
        {children}
      </div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ open, onClose, currentTheme, onThemeChange }) => {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Colors</h2>
          <button className="settings-close" onClick={onClose} data-testid="close-settings">
            <X size={24} />
          </button>
        </div>
        
        <div className="settings-body">
          {/* Color themes grid */}
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
                  <span 
                    className="theme-dot" 
                    style={{ backgroundColor: theme.color }}
                  />
                </button>
              );
            })}
          </div>

          {/* Special themes */}
          <div className="special-themes">
            <p className="special-themes-label">Other themes</p>
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
        </div>
      </div>
    </div>
  );
};

// Landing Screen
const LandingScreen = ({ onSelectProfile }) => {
  return (
    <div className="landing-screen" data-testid="landing-screen">
      <div className="landing-content">
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

// Section Card Component
const SectionCard = ({ section, taskCount, onClick, theme }) => {
  const config = getSectionConfig(theme, section);
  
  return (
    <div 
      className="section-card" 
      onClick={onClick}
      data-testid={`section-card-${section}`}
    >
      <img 
        src={config.image} 
        alt={config.label} 
        className="section-emoji-img"
      />
      <div className="section-info">
        <h2 className="section-title">{config.label}</h2>
        <span className="task-count-badge" data-testid={`count-${section}`}>
          {taskCount}
        </span>
      </div>
    </div>
  );
};

// Profile Screen
const ProfileScreen = ({ profile, tasks, onBack, onSelectSection, onOpenSettings, theme }) => {
  const profileLabel = profile.charAt(0).toUpperCase() + profile.slice(1);
  
  const getTaskCount = (section) => {
    return tasks.filter((t) => t.section === section && !t.completed).length;
  };

  return (
    <div className="profile-screen" data-testid="profile-screen">
      <div className="screen-header">
        <h1 className="header-title">{profileLabel}</h1>
        <button 
          className="settings-btn"
          onClick={onOpenSettings}
          data-testid="settings-btn"
        >
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
        <button 
          className="back-btn"
          onClick={onBack}
          data-testid="back-btn"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <button 
          className="fab"
          onClick={() => onSelectSection("today")}
          data-testid="add-task-fab"
        >
          <img 
            src="/emojis/writing-hand.png" 
            alt="Add task" 
            className="fab-emoji"
          />
        </button>
      </div>
    </div>
  );
};

// Task Item Component
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
    <div
      className="task-item"
      onClick={() => onEdit(task)}
      data-testid={`task-item-${task.id}`}
    >
      <div className="task-content">
        <span className={`task-title ${task.completed ? "completed" : ""}`}>
          {mainTitle}
        </span>
        {subtasks.length > 0 && (
          <div className="task-subtasks">
            {subtasks.map((subtask, index) => (
              <div key={index} className="subtask-item">
                <div className={`subtask-checkbox ${task.completed ? "checked" : ""}`}>
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={`subtask-title ${task.completed ? "completed" : ""}`}>
                  {subtask}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className={`task-checkbox ${task.completed ? "checked" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        data-testid={`task-checkbox-${task.id}`}
      >
        {task.completed && <Check size={16} strokeWidth={3} />}
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ section, onAddClick, theme }) => {
  const config = getSectionConfig(theme, section);
  const emptyTexts = {
    today: { text: "No tasks for today", hint: "tap + to add one" },
    tomorrow: { text: "Nothing planned for tomorrow", hint: "tap + to add something" },
    someday: { text: "No someday tasks yet", hint: "tap + to dream big" },
  };
  
  return (
    <div className="empty-state" onClick={onAddClick} data-testid="empty-state">
      <img 
        src={config.image} 
        alt={config.label} 
        className="empty-state-emoji"
      />
      <p className="empty-state-text">{emptyTexts[section].text}</p>
      <p className="empty-state-hint">{emptyTexts[section].hint}</p>
    </div>
  );
};

// Section Detail Screen
const SectionScreen = ({ 
  profile, 
  section, 
  tasks, 
  onBack, 
  onToggleTask, 
  onEditTask,
  onAddTask,
  onClearCompleted,
  theme
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
    if (!allTasksCompleted) {
      setHasShownConfetti(false);
    }
  }, [allTasksCompleted]);
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchEnd - touchStart;
    if (diff > 100) {
      onBack();
    }
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
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={onEditTask}
            />
          ))}

          {completedTasks.length > 0 && (
            <div className="completed-section">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="screen-footer">
        <div className="footer-actions-bubble">
          <button 
            className="footer-action-btn"
            onClick={onBack}
            data-testid="footer-back-btn"
          >
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
        <button 
          className="fab"
          onClick={() => setAddDrawerOpen(true)}
          data-testid="section-add-fab"
        >
          <img 
            src="/emojis/writing-hand.png" 
            alt="Add task" 
            className="fab-emoji"
          />
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
          <button
            className="action-btn"
            onClick={onClose}
            data-testid="back-action-btn"
          >
            <ArrowLeft size={22} />
          </button>
          <button
            className="action-btn delete"
            onClick={handleDelete}
            data-testid="delete-task-btn"
          >
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
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('taskTheme') || 'yellow';
  });

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('taskTheme', theme);
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

  const handleBackFromSection = () => {
    setCurrentSection(null);
  };

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
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingTask(null);
        }}
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
      />
    </div>
  );
}

export default App;
