import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Settings, ArrowLeft, Check, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import confetti from "canvas-confetti";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Section config with image paths and placeholders
const SECTION_CONFIG = {
  today: { 
    image: "/emojis/bee.png", 
    label: "today", 
    placeholder: "today I will...",
    emptyText: "No tasks for today",
    emptyHint: "tap + to add one"
  },
  tomorrow: { 
    image: "/emojis/lemon.png", 
    label: "tomorrow", 
    placeholder: "tomorrow I will...",
    emptyText: "Nothing planned for tomorrow",
    emptyHint: "tap + to add something"
  },
  someday: { 
    image: "/emojis/sunflower.png", 
    label: "someday", 
    placeholder: "someday I will...",
    emptyText: "No someday tasks yet",
    emptyHint: "tap + to dream big"
  },
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

// Section Card Component (for main profile screen)
const SectionCard = ({ section, taskCount, onClick }) => {
  const config = SECTION_CONFIG[section];
  
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

// Profile Screen (shows section cards)
const ProfileScreen = ({ profile, tasks, onBack, onSelectSection, onOpenSettings }) => {
  const profileLabel = profile.charAt(0).toUpperCase() + profile.slice(1);
  
  const getTaskCount = (section) => {
    return tasks.filter((t) => t.section === section && !t.completed).length;
  };

  return (
    <div className="profile-screen" data-testid="profile-screen">
      {/* Header */}
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

      {/* Section Cards */}
      <div className="sections-container">
        {["today", "tomorrow", "someday"].map((section) => (
          <SectionCard
            key={section}
            section={section}
            taskCount={getTaskCount(section)}
            onClick={() => onSelectSection(section)}
          />
        ))}
      </div>

      {/* Footer */}
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
  return (
    <div
      className="task-item"
      onClick={() => onEdit(task)}
      data-testid={`task-item-${task.id}`}
    >
      <span className={`task-title ${task.completed ? "completed" : ""}`}>
        {task.title}
      </span>
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
const EmptyState = ({ section, onAddClick }) => {
  const config = SECTION_CONFIG[section];
  
  return (
    <div className="empty-state" onClick={onAddClick} data-testid="empty-state">
      <img 
        src={config.image} 
        alt={config.label} 
        className="empty-state-emoji"
      />
      <p className="empty-state-text">{config.emptyText}</p>
      <p className="empty-state-hint">{config.emptyHint}</p>
    </div>
  );
};

// Section Detail Screen (shows tasks for a section)
const SectionScreen = ({ 
  profile, 
  section, 
  tasks, 
  onBack, 
  onToggleTask, 
  onEditTask,
  onAddTask,
  onClearCompleted
}) => {
  const config = SECTION_CONFIG[section];
  const sectionTasks = tasks.filter((t) => t.section === section);
  const incompleteTasks = sectionTasks.filter((t) => !t.completed);
  const completedTasks = sectionTasks.filter((t) => t.completed);
  const taskCount = incompleteTasks.length;
  const allTasksCompleted = sectionTasks.length > 0 && incompleteTasks.length === 0;
  const hasNoTasks = sectionTasks.length === 0;

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  
  // Swipe to go back
  const [touchStart, setTouchStart] = useState(null);
  
  // Trigger confetti when all tasks completed
  useEffect(() => {
    if (allTasksCompleted && !hasShownConfetti && completedTasks.length > 0) {
      triggerConfetti();
      setHasShownConfetti(true);
    }
  }, [allTasksCompleted, hasShownConfetti, completedTasks.length]);

  // Reset confetti flag when tasks change
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
      {/* Section Header */}
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

      {/* Task List or Empty State */}
      {hasNoTasks ? (
        <EmptyState section={section} onAddClick={() => setAddDrawerOpen(true)} />
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

      {/* Footer - Back and Clear in same bubble */}
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

      {/* Add Task Drawer */}
      <Drawer open={addDrawerOpen} onOpenChange={setAddDrawerOpen}>
        <DrawerContent className="add-drawer-content" data-testid="add-task-drawer">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Add New Task</DrawerTitle>
            <DrawerDescription>Create a new task</DrawerDescription>
          </DrawerHeader>
          <div className="add-drawer-body">
            <input
              type="text"
              className="add-task-input"
              placeholder={config.placeholder}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              autoFocus
              data-testid="add-task-input"
            />
            <button
              className="add-task-btn"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              data-testid="add-task-submit-btn"
            >
              add
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// Edit Task Drawer
const EditTaskDrawer = ({ open, onClose, task, onUpdate, onDelete }) => {
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
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent data-testid="edit-task-drawer">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Edit Task</DrawerTitle>
          <DrawerDescription>Modify your task</DrawerDescription>
        </DrawerHeader>
        <div className="edit-drawer-body">
          <input
            type="text"
            className="edit-task-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="edit-task-input"
          />
          
          <div className="section-selector">
            {Object.entries(SECTION_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`section-pill ${section === key ? "active" : ""}`}
                onClick={() => setSection(key)}
                data-testid={`edit-section-pill-${key}`}
              >
                <img src={config.image} alt={config.label} className="pill-emoji" />
                <span>{config.label}</span>
              </button>
            ))}
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={!title.trim()}
              data-testid="save-task-btn"
            >
              save
            </button>
          </div>
          
          {/* Action buttons in bubble design */}
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
      </DrawerContent>
    </Drawer>
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
        />
      ) : (
        <ProfileScreen
          profile={currentProfile}
          tasks={tasks}
          onBack={handleBackFromProfile}
          onSelectSection={setCurrentSection}
          onOpenSettings={() => {}}
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
      />
    </div>
  );
}

export default App;
