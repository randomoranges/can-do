import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Settings, Plus, Check, RotateCcw, Trash2, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Section emojis (Apple style from emojipedia)
const SECTION_CONFIG = {
  today: { emoji: "🐝", label: "today" },
  tomorrow: { emoji: "🍋", label: "tomorrow" },
  later: { emoji: "🌻", label: "later" },
};

// Landing Screen
const LandingScreen = ({ onSelectProfile }) => {
  return (
    <div className="landing-screen" data-testid="landing-screen">
      <p className="landing-tagline">
        One task at a time,
        <br />
        you've got this.
      </p>
      
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

// Task Item Component
const TaskItem = ({ task, onToggle, onEdit }) => {
  return (
    <div
      className="task-item task-card"
      onClick={() => onEdit(task)}
      data-testid={`task-item-${task.id}`}
    >
      <div
        className={`task-checkbox ${task.completed ? "checked" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        data-testid={`task-checkbox-${task.id}`}
      >
        {task.completed && <Check size={14} strokeWidth={3} />}
      </div>
      <span className={`task-title ${task.completed ? "completed" : ""}`}>
        {task.title}
      </span>
    </div>
  );
};

// Section Component
const TaskSection = ({ section, tasks, onToggleTask, onEditTask }) => {
  const config = SECTION_CONFIG[section];
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const taskCount = incompleteTasks.length;

  return (
    <div className="task-section" data-testid={`section-${section}`}>
      <div className="section-card">
        <div className="section-header">
          <span className="section-emoji">{config.emoji}</span>
        </div>
        <div className="section-title-row">
          <h2 className="section-title">{config.label}</h2>
          <span className="task-count-badge" data-testid={`count-${section}`}>
            {taskCount}
          </span>
        </div>

        {incompleteTasks.length > 0 && (
          <div className="task-list">
            {incompleteTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onEdit={onEditTask}
              />
            ))}
          </div>
        )}

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
    </div>
  );
};

// Add Task Drawer
const AddTaskDrawer = ({ open, onClose, onAdd, currentSection }) => {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState(currentSection || "today");

  useEffect(() => {
    if (open) {
      setTitle("");
      setSection(currentSection || "today");
    }
  }, [open, currentSection]);

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim(), section);
      setTitle("");
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && title.trim()) {
      handleAdd();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent data-testid="add-task-drawer">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Add New Task</DrawerTitle>
          <DrawerDescription>Create a new task for your list</DrawerDescription>
        </DrawerHeader>
        <div className="drawer-content">
          <input
            type="text"
            className="drawer-input"
            placeholder="today I will..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            data-testid="add-task-input"
          />
          
          <div className="drawer-actions">
            {Object.entries(SECTION_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`section-pill ${section === key ? "active" : ""}`}
                onClick={() => setSection(key)}
                data-testid={`section-pill-${key}`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            ))}
            
            <button
              className="add-btn"
              onClick={handleAdd}
              disabled={!title.trim()}
              data-testid="add-task-submit-btn"
            >
              add
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
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
          <DrawerDescription>Modify or delete your task</DrawerDescription>
        </DrawerHeader>
        <div className="drawer-content">
          <input
            type="text"
            className="drawer-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="edit-task-input"
          />
          
          <div className="drawer-actions">
            {Object.entries(SECTION_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`section-pill ${section === key ? "active" : ""}`}
                onClick={() => setSection(key)}
                data-testid={`edit-section-pill-${key}`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            ))}
            
            <button
              className="add-btn"
              onClick={handleSave}
              disabled={!title.trim()}
              data-testid="save-task-btn"
            >
              save
            </button>
          </div>
          
          <div className="flex justify-center mt-4">
            <button
              className="delete-btn flex items-center gap-2 text-sm"
              onClick={handleDelete}
              data-testid="delete-task-btn"
            >
              <Trash2 size={16} />
              <span>Delete task</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Tasks Screen
const TasksScreen = ({ profile, onBack }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/tasks/${profile}`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (title, section) => {
    try {
      const response = await axios.post(`${API}/tasks`, {
        title,
        profile,
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

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditDrawerOpen(true);
  };

  const getTasksBySection = (section) =>
    tasks.filter((t) => t.section === section);

  const profileLabel = profile.charAt(0).toUpperCase() + profile.slice(1);

  if (loading) {
    return (
      <div className="tasks-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="tasks-screen" data-testid="tasks-screen">
      {/* Header */}
      <div className="tasks-header">
        <h1 className="profile-title">{profileLabel}</h1>
        <button
          className="settings-btn"
          onClick={onBack}
          data-testid="back-btn"
        >
          <X size={20} />
        </button>
      </div>

      {/* Sections */}
      {["today", "tomorrow", "later"].map((section) => (
        <TaskSection
          key={section}
          section={section}
          tasks={getTasksBySection(section)}
          onToggleTask={handleToggleTask}
          onEditTask={handleEditTask}
        />
      ))}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className="nav-btn"
          onClick={fetchTasks}
          data-testid="refresh-btn"
        >
          <RotateCcw size={20} />
        </button>
        <button
          className="fab"
          onClick={() => setAddDrawerOpen(true)}
          data-testid="add-task-fab"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Add Task Drawer */}
      <AddTaskDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onAdd={handleAddTask}
        currentSection="today"
      />

      {/* Edit Task Drawer */}
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
};

// Main App
function App() {
  const [currentProfile, setCurrentProfile] = useState(null);

  return (
    <div className="app-container">
      <Toaster position="top-center" richColors />
      
      {!currentProfile ? (
        <LandingScreen onSelectProfile={setCurrentProfile} />
      ) : (
        <TasksScreen
          profile={currentProfile}
          onBack={() => setCurrentProfile(null)}
        />
      )}
    </div>
  );
}

export default App;
