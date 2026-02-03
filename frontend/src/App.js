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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Section config with image paths
const SECTION_CONFIG = {
  today: { image: "/emojis/bee.png", label: "today" },
  tomorrow: { image: "/emojis/lemon.png", label: "tomorrow" },
  someday: { image: "/emojis/sunflower.png", label: "someday" },
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
    const sectionKey = section === "someday" ? "someday" : section;
    return tasks.filter((t) => t.section === sectionKey && !t.completed).length;
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

// Section Detail Screen (shows tasks for a section)
const SectionScreen = ({ 
  profile, 
  section, 
  tasks, 
  onBack, 
  onToggleTask, 
  onEditTask,
  onAddTask 
}) => {
  const config = SECTION_CONFIG[section];
  const sectionTasks = tasks.filter((t) => t.section === section);
  const incompleteTasks = sectionTasks.filter((t) => !t.completed);
  const completedTasks = sectionTasks.filter((t) => t.completed);
  const taskCount = incompleteTasks.length;

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), section);
      setNewTaskTitle("");
      setAddDrawerOpen(false);
    }
  };

  return (
    <div className="section-screen" data-testid={`section-screen-${section}`}>
      {/* Section Header */}
      <div className="section-header-detail">
        <img 
          src={config.image} 
          alt={config.label} 
          className="section-header-emoji"
        />
        <div className="section-header-info">
          <h1 className="section-header-title">{config.label}</h1>
          <span className="section-header-count">{taskCount}</span>
        </div>
      </div>

      {/* Task List */}
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

      {/* Footer */}
      <div className="screen-footer">
        <button 
          className="back-btn clear-btn"
          onClick={onBack}
          data-testid="section-back-btn"
        >
          <span className="clear-icon">Tx</span>
        </button>
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
              placeholder="today I will..."
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
const EditTaskDrawer = ({ open, onClose, task, onUpdate, onDelete, sections }) => {
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
          
          <button
            className="delete-btn"
            onClick={handleDelete}
            data-testid="delete-task-btn"
          >
            <Trash2 size={16} />
            <span>Delete task</span>
          </button>
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
