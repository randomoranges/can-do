import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { Toaster, toast } from "sonner";
import { Settings, ArrowLeft, Check, Trash2, X, Sun, Moon, Monitor, LogOut, User, Mail, ToggleLeft, ToggleRight } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "./supabaseClient";

// Theme configurations - CORRECTED arrangement
const THEMES = {
  yellow: {
    name: "Yellow",
    color: "#F59E0B",
    caption: "bee yellow",
    today: { image: "/emojis/bee.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/lemon.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/sunflower.png", label: "someday", placeholder: "someday I will..." },
  },
  gold: {
    name: "Gold",
    color: "#D97706",
    caption: "golden brown texture, like sun",
    today: { image: "/emojis/green-beer.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/gold-tumbler.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/gold-clinking.png", label: "someday", placeholder: "someday I will..." },
  },
  green: {
    name: "Green",
    color: "#16A34A",
    caption: "you don't get high, you get medicated",
    today: { image: "/emojis/gold-shamrock.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/green-plant.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/green-tree.png", label: "someday", placeholder: "someday I will..." },
  },
  red: {
    name: "Red",
    color: "#DC2626",
    caption: "may you find true luv in this life or next, if you hve already found, go listen to GFY song by Dennis Lloyd (01:39 to 02:22)",
    today: { image: "/emojis/red-rose.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/red-wine.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/red-heart.png", label: "someday", placeholder: "someday I will..." },
  },
  violet: {
    name: "Violet",
    color: "#7C3AED",
    caption: "why violet?",
    today: { image: "/emojis/violet-ok.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/violet-shrug.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/violet-pregnant.png", label: "someday", placeholder: "someday I will..." },
  },
  blue: {
    name: "Blue",
    color: "#2563EB",
    caption: "butterfly effect",
    today: { image: "/emojis/blue-butterfly.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/blue-thunder.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/blue-wave.png", label: "someday", placeholder: "someday I will..." },
  },
  white: {
    name: "White",
    color: "#9CA3AF",
    caption: "trading is hard",
    today: { image: "/emojis/white-chart.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/white-down.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/white-up.png", label: "someday", placeholder: "someday I will..." },
  },
  pink: {
    name: "Pink",
    color: "#EC4899",
    caption: "pinkyys are so wanna be's",
    today: { image: "/emojis/pink-blossom.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/flamingo.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/pink-heart.png", label: "someday", placeholder: "someday I will..." },
  },
  brown: {
    name: "Brown",
    color: "#92400E",
    caption: "brown is not a real color",
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
  // New special themes
  cuddle: {
    name: "But please I really want someone to cuddle",
    color: "#F9A8D4",
    today: { image: "/emojis/pleading-face.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/couch.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/teddy-bear.png", label: "someday", placeholder: "someday I will..." },
  },
  goodboy: {
    name: "Good boy, mad city",
    color: "#F97316",
    today: { image: "/emojis/dog.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/cityscape-dusk.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/fire.png", label: "someday", placeholder: "someday I will..." },
  },
  faded: {
    name: "It's 2am and everybody faded",
    color: "#6366F1",
    today: { image: "/emojis/two-oclock.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/cigarette.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/milky-way.png", label: "someday", placeholder: "someday I will..." },
  },
  blues: {
    name: "Careless love blues",
    color: "#3B82F6",
    today: { image: "/emojis/blue-heart.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/guitar.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/blue-heart.png", label: "someday", placeholder: "someday I will..." },
  },
  dreams: {
    name: "Some dreams coming to fruition",
    color: "#8B5CF6",
    today: { image: "/emojis/thought-bubble.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/racing-car.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/grapes.png", label: "someday", placeholder: "someday I will..." },
  },
  lipstick: {
    name: "Lipstick spoiler",
    color: "#E11D48",
    today: { image: "/emojis/kiss-mark.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/kiss-mark.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/kiss-mark.png", label: "someday", placeholder: "someday I will..." },
  },
  citrus: {
    name: "Project citrus",
    color: "#F97316",
    today: { image: "/emojis/tangerine.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/tangerine.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/tangerine.png", label: "someday", placeholder: "someday I will..." },
  },
  shirt: {
    name: "Bitch! Give back my shirt",
    color: "#EC4899",
    today: { image: "/emojis/nail-polish.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/steam-nose.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/tshirt.png", label: "someday", placeholder: "someday I will..." },
  },
  monkeys: {
    name: "Three monkeys",
    color: "#92400E",
    today: { image: "/emojis/see-no-evil.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/hear-no-evil.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/speak-no-evil.png", label: "someday", placeholder: "someday I will..." },
  },
  smalld: {
    name: "Small d*ck energy",
    color: "#7C3AED",
    today: { image: "/emojis/pinching-hand.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/eggplant.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/battery.png", label: "someday", placeholder: "someday I will..." },
  },
  alright: {
    name: "Alright, alright, alright",
    color: "#FBBF24",
    today: { image: "/emojis/thumbs-up.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/thumbs-up.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/thumbs-up.png", label: "someday", placeholder: "someday I will..." },
  },
  rocks: {
    name: "Just rocks",
    color: "#78716C",
    today: { image: "/emojis/rock.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/rock.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/rock.png", label: "someday", placeholder: "someday I will..." },
  },
  freezing: {
    name: "It's cold in my veins, I'm below freezing",
    color: "#0EA5E9",
    today: { image: "/emojis/scarf.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/snowman.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/cold-face.png", label: "someday", placeholder: "someday I will..." },
  },
  softhours: {
    name: "Soft hours",
    color: "#64748B",
    today: { image: "/emojis/cigarette.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/window.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/cloud-rain.png", label: "someday", placeholder: "someday I will..." },
  },
  dinner: {
    name: "Dinner for one",
    color: "#EF4444",
    today: { image: "/emojis/kitchen-knife.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/onion.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/crying-face.png", label: "someday", placeholder: "someday I will..." },
  },
  almost: {
    name: "Almost there",
    color: "#10B981",
    today: { image: "/emojis/person-walking.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/person-walking.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/person-standing.png", label: "someday", placeholder: "someday I will..." },
  },
  cozy: {
    name: "Cozy vol. 1",
    color: "#F43F5E",
    today: { image: "/emojis/rose.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/bathtub.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/people-hugging.png", label: "someday", placeholder: "someday I will..." },
  },
  doubt: {
    name: "When in doubt, fuck.",
    color: "#A855F7",
    today: { image: "/emojis/question-mark.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/person-shrugging.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/bed.png", label: "someday", placeholder: "someday I will..." },
  },
  // New themes batch 2
  lavender: {
    name: "Enchanted lavender sunrise",
    color: "#A78BFA",
    today: { image: "/emojis/sparkles.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/hyacinth.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/sunrise.png", label: "someday", placeholder: "someday I will..." },
  },
  luckysperm: {
    name: "Lucky sperm club",
    color: "#22D3EE",
    today: { image: "/emojis/crossed-fingers.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/sweat-droplets.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/person-golfing.png", label: "someday", placeholder: "someday I will..." },
  },
  unaccompanied: {
    name: "Unaccompanied Minor",
    color: "#0EA5E9",
    today: { image: "/emojis/child.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/airplane.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/label.png", label: "someday", placeholder: "someday I will..." },
  },
  october: {
    name: "October's very own",
    color: "#F97316",
    today: { image: "/emojis/fallen-leaf.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/pumpkin.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/owl.png", label: "someday", placeholder: "someday I will..." },
  },
  procrastinator: {
    name: "Chief Procrastinator Officer",
    color: "#6366F1",
    today: { image: "/emojis/couch.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/mobile-phone.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/alarm-clock.png", label: "someday", placeholder: "someday I will..." },
  },
  sleep: {
    name: "Ministry of Sleep",
    color: "#94A3B8",
    today: { image: "/emojis/sloth.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/koala.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/yawning-face.png", label: "someday", placeholder: "someday I will..." },
  },
  burka: {
    name: "Lipstick under the burka",
    color: "#1F2937",
    today: { image: "/emojis/lipstick.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/woman-headscarf.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/black-heart.png", label: "someday", placeholder: "someday I will..." },
  },
  donuts: {
    name: "Trusty donuts",
    color: "#F472B6",
    today: { image: "/emojis/doughnut.png", label: "today", placeholder: "today I will..." },
    tomorrow: { image: "/emojis/doughnut.png", label: "tomorrow", placeholder: "tomorrow I will..." },
    someday: { image: "/emojis/doughnut.png", label: "someday", placeholder: "someday I will..." },
  },
};

const COLOR_THEMES = ["yellow", "gold", "green", "red", "violet", "blue", "white", "pink", "brown"];
const SPECIAL_THEMES = [
  "healthy", "gym", "farm", "money",
  "cuddle", "goodboy", "faded", "blues", "dreams",
  "lipstick", "citrus", "shirt", "monkeys", "smalld",
  "alright", "rocks", "freezing", "softhours", "dinner",
  "almost", "cozy", "doubt",
  "lavender", "luckysperm", "unaccompanied", "october",
  "procrastinator", "sleep", "burka", "donuts"
];

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
  const duration = 4000;
  const end = Date.now() + duration;
  
  // All gold color palette
  const goldColors = ['#FFD700', '#FFC107', '#FFCA28', '#FFB300', '#FFA000', '#DAA520'];
  
  const frame = () => {
    // Left side burst
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors: goldColors,
      ticks: 200,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['circle', 'square'],
      scalar: 1.2
    });
    // Right side burst
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors: goldColors,
      ticks: 200,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['circle', 'square'],
      scalar: 1.2
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
  onLogout,
  happySettings,
  onHappyToggle,
  onHappySave
}) => {
  const [happyEmail, setHappyEmail] = useState(happySettings?.email || '');
  const [happyName, setHappyName] = useState(happySettings?.name || '');
  const [happyTimezone, setHappyTimezone] = useState(happySettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [happyLocation, setHappyLocation] = useState(happySettings?.location || '');
  const [happyDirty, setHappyDirty] = useState(false);

  useEffect(() => {
    if (happySettings) {
      setHappyEmail(happySettings.email || '');
      setHappyName(happySettings.name || '');
      setHappyTimezone(happySettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      setHappyLocation(happySettings.location || '');
      setHappyDirty(false);
    }
  }, [happySettings]);
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
          
          {/* Happy - AI Email Assistant */}
          {user && !isGuest && (
            <div className="settings-section happy-section">
              <div className="happy-header">
                <div className="happy-label">
                  <Mail size={18} />
                  <span>Happy</span>
                  <span className="happy-badge">AI</span>
                </div>
                <button
                  className="happy-toggle-btn"
                  onClick={onHappyToggle}
                >
                  {happySettings?.enabled ? (
                    <ToggleRight size={28} color="#F59E0B" />
                  ) : (
                    <ToggleLeft size={28} color="#9CA3AF" />
                  )}
                </button>
              </div>
              <p className="happy-description">
                Your AI accountability buddy. Sends you emails about your tasks — morning briefings, midday nudges, evening recaps, and friendly roasts.
              </p>
              {happySettings?.enabled && (
                <div className="happy-fields">
                  <div className="happy-field">
                    <label className="happy-field-label">Your name</label>
                    <input
                      type="text"
                      className="happy-input"
                      placeholder="What should Happy call you?"
                      value={happyName}
                      onChange={(e) => { setHappyName(e.target.value); setHappyDirty(true); }}
                    />
                  </div>
                  <div className="happy-field">
                    <label className="happy-field-label">Email</label>
                    <input
                      type="email"
                      className="happy-input"
                      placeholder="Where should Happy email you?"
                      value={happyEmail}
                      onChange={(e) => { setHappyEmail(e.target.value); setHappyDirty(true); }}
                    />
                  </div>
                  <div className="happy-field">
                    <label className="happy-field-label">Timezone</label>
                    <select
                      className="happy-input happy-select"
                      value={happyTimezone}
                      onChange={(e) => { setHappyTimezone(e.target.value); setHappyDirty(true); }}
                    >
                      {[
                        'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                        'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver',
                        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
                        'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
                        'Asia/Singapore', 'Asia/Bangkok', 'Australia/Sydney', 'Australia/Melbourne',
                        'Pacific/Auckland', 'Africa/Cairo', 'Africa/Lagos', 'America/Sao_Paulo',
                        'America/Mexico_City', 'Asia/Seoul', 'Asia/Hong_Kong', 'Asia/Jakarta',
                      ].map(tz => (
                        <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="happy-field">
                    <label className="happy-field-label">Location</label>
                    <input
                      type="text"
                      className="happy-input"
                      placeholder="City, Country (e.g. Mumbai, India)"
                      value={happyLocation}
                      onChange={(e) => { setHappyLocation(e.target.value); setHappyDirty(true); }}
                    />
                    <span className="happy-field-hint">For weather-aware emails</span>
                  </div>
                  {happyDirty && happyEmail && (
                    <button
                      className="happy-save-btn"
                      onClick={() => { onHappySave(happyName, happyEmail, happyTimezone, happyLocation); setHappyDirty(false); }}
                    >
                      Save
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

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
        <h1 className="login-title">DoIt</h1>
        <p className="login-tagline">
          One task at a time,
          <br />
          you&apos;ve got this.
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

      <p className="login-hint">
        Guest mode saves tasks locally on this device
      </p>
    </div>
  );
};

// Format date helper
const formatDate = () => {
  const date = new Date();
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Landing Screen (Profile Selection)
const LandingScreen = ({ onSelectProfile, userName }) => {
  return (
    <div className="landing-screen" data-testid="landing-screen">
      <div className="landing-header">
        {userName ? (
          <p className="welcome-text">Welcome back, {userName.split(' ')[0]}!</p>
        ) : (
          <p className="welcome-text">Hello there!</p>
        )}
        <p className="date-text">{formatDate()}</p>
      </div>
      
      <div className="landing-content">
        <p className="landing-tagline">
          One task at a time,
          <br />
          you&apos;ve got this.
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

// Wins Screen
const WinsScreen = ({ wins, onBack }) => {
  const [filter, setFilter] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const sortedWins = [...wins].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  // Get available months from wins data
  const getAvailableMonths = () => {
    const months = new Map();
    sortedWins.forEach(w => {
      const d = new Date(w.completed_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!months.has(key)) months.set(key, label);
    });
    return Array.from(months, ([key, label]) => ({ key, label }));
  };

  // Get available years
  const getAvailableYears = () => {
    const years = new Set();
    sortedWins.forEach(w => years.add(new Date(w.completed_at).getFullYear()));
    return Array.from(years).sort((a, b) => b - a).map(y => ({ key: `year-${y}`, label: `${y}` }));
  };

  const filterWins = (wins) => {
    const now = new Date();
    if (filter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return wins.filter(w => new Date(w.completed_at) >= start);
    }
    if (filter === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return wins.filter(w => new Date(w.completed_at) >= start);
    }
    if (filter.startsWith('year-')) {
      const year = parseInt(filter.split('-')[1]);
      return wins.filter(w => new Date(w.completed_at).getFullYear() === year);
    }
    if (filter.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = filter.split('-').map(Number);
      return wins.filter(w => {
        const d = new Date(w.completed_at);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
    return wins;
  };

  const formatWinDate = (dateStr) => {
    const date = new Date(dateStr);
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    const timeOpts = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${date.toLocaleDateString('en-US', opts)} \u2022 ${date.toLocaleTimeString('en-US', timeOpts)}`;
  };

  const filteredWins = filterWins(sortedWins);

  const baseFilters = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
  ];
  const monthFilters = getAvailableMonths();
  const yearFilters = getAvailableYears();

  // Analytics
  const computeAnalytics = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayCount = sortedWins.filter(w => new Date(w.completed_at) >= todayStart).length;
    const weekCount = sortedWins.filter(w => new Date(w.completed_at) >= weekStart).length;
    const monthCount = sortedWins.filter(w => new Date(w.completed_at) >= monthStart).length;
    const totalCount = sortedWins.length;

    // Streak: consecutive days with at least one win
    let streak = 0;
    const dayCheck = new Date(todayStart);
    const winDays = new Set();
    sortedWins.forEach(w => {
      const d = new Date(w.completed_at);
      winDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    while (winDays.has(`${dayCheck.getFullYear()}-${dayCheck.getMonth()}-${dayCheck.getDate()}`)) {
      streak++;
      dayCheck.setDate(dayCheck.getDate() - 1);
    }

    // Best day
    const dayCounts = {};
    sortedWins.forEach(w => {
      const d = new Date(w.completed_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    });
    const bestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    let bestDay = null;
    if (bestDayEntry) {
      const [y, m, d] = bestDayEntry[0].split('-').map(Number);
      bestDay = {
        date: new Date(y, m, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: bestDayEntry[1],
      };
    }

    // Weekly bar chart (last 7 days)
    const weeklyBars = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      weeklyBars.push({
        label: dayLabels[d.getDay()],
        count: dayCounts[key] || 0,
        isToday: i === 0,
      });
    }
    const maxBar = Math.max(...weeklyBars.map(b => b.count), 1);

    return { todayCount, weekCount, monthCount, totalCount, streak, bestDay, weeklyBars, maxBar };
  };

  const analytics = computeAnalytics();

  return (
    <div className="wins-screen" data-testid="wins-screen">
      <div className="wins-header">
        <button className="wins-back-btn" onClick={onBack} data-testid="wins-back-btn">
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
      </div>

      <div className="wins-scrollable">
        {/* Hero */}
        <div className="wins-hero">
          <div className="wins-hero-card" onClick={() => setShowAnalytics(!showAnalytics)}>
            <img src="/emojis/raising-hands.png" alt="Wins" className="wins-hero-emoji" />
            <p className="wins-hero-text">
              {showAnalytics ? 'Your wins dashboard' : 'Every done task lives here. Proof you showed up.'}
            </p>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="wins-analytics">
            <div className="analytics-stats">
              <div className="analytics-stat">
                <span className="stat-number">{analytics.todayCount}</span>
                <span className="stat-label">today</span>
              </div>
              <div className="analytics-stat">
                <span className="stat-number">{analytics.weekCount}</span>
                <span className="stat-label">this week</span>
              </div>
              <div className="analytics-stat">
                <span className="stat-number">{analytics.monthCount}</span>
                <span className="stat-label">this month</span>
              </div>
              <div className="analytics-stat">
                <span className="stat-number">{analytics.totalCount}</span>
                <span className="stat-label">all time</span>
              </div>
            </div>

            <div className="analytics-row">
              <div className="analytics-card">
                <span className="analytics-card-value">{analytics.streak}</span>
                <span className="analytics-card-label">day streak</span>
              </div>
              {analytics.bestDay && (
                <div className="analytics-card">
                  <span className="analytics-card-value">{analytics.bestDay.count}</span>
                  <span className="analytics-card-label">best day ({analytics.bestDay.date})</span>
                </div>
              )}
            </div>

            <div className="analytics-chart">
              <p className="analytics-chart-title">Last 7 days</p>
              <div className="analytics-bars">
                {analytics.weeklyBars.map((bar, i) => (
                  <div key={i} className="analytics-bar-col">
                    <div className="analytics-bar-track">
                      <div
                        className={`analytics-bar-fill ${bar.isToday ? 'today' : ''}`}
                        style={{ height: `${(bar.count / analytics.maxBar) * 100}%` }}
                      />
                    </div>
                    <span className={`analytics-bar-label ${bar.isToday ? 'today' : ''}`}>{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="wins-filters">
          {baseFilters.map(f => (
            <button
              key={f.key}
              className={`wins-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          {monthFilters.map(f => (
            <button
              key={f.key}
              className={`wins-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          {yearFilters.map(f => (
            <button
              key={f.key}
              className={`wins-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Wins List */}
        <div className="wins-list-inner">
          {filteredWins.length === 0 ? (
            <div className="wins-empty">
              <p className="wins-empty-text">
                {filter === 'all' ? 'No wins yet. Go check off a task!' : 'No wins in this period.'}
              </p>
            </div>
          ) : (
            filteredWins.map((win) => (
              <div key={win.id} className="wins-card" data-testid={`win-card-${win.id}`}>
                <div className="wins-card-content">
                  <span className="wins-task-title">{win.task}</span>
                  <span className="wins-task-date">{formatWinDate(win.completed_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="wins-count-footer">
        <span className="wins-total">{filteredWins.length} win{filteredWins.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

// Profile Screen
const ProfileScreen = ({ profile, tasks, onBack, onSelectSection, onOpenSettings, theme, onRandomTheme, onOpenWins }) => {
  const profileLabel = profile.charAt(0).toUpperCase() + profile.slice(1);
  const getTaskCount = (section) => tasks.filter((t) => t.section === section && !t.completed).length;
  const [themeTooltip, setThemeTooltip] = useState(null);
  const tooltipTimerRef = useRef(null);

  const handleRandomTheme = () => {
    const newTheme = onRandomTheme();
    const themeData = THEMES[newTheme];
    const caption = themeData.caption || themeData.name;
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setThemeTooltip(caption);
    tooltipTimerRef.current = setTimeout(() => setThemeTooltip(null), 3000);
  };

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

      {themeTooltip && (
        <div className="theme-tooltip-bubble" data-testid="theme-tooltip">
          {themeTooltip}
        </div>
      )}

      <div className="screen-footer">
        <button className="back-btn" onClick={onBack} data-testid="back-btn">
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <div className="fab-group">
          <button className="fab" onClick={handleRandomTheme} data-testid="random-theme-btn">
            <img src="/emojis/dice.png" alt="Random theme" className="fab-emoji" />
          </button>
          <button className="fab" onClick={onOpenWins} data-testid="wins-btn">
            <img src="/emojis/raising-hands.png" alt="Wins" className="fab-emoji" />
          </button>
          <button className="fab" onClick={() => onSelectSection("today")} data-testid="add-task-fab">
            <img src="/emojis/writing-hand.png" alt="Add task" className="fab-emoji" />
          </button>
        </div>
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
  profile, section, tasks, onBack, onToggleTask, onEditTask, onAddTask, onClearCompleted, theme, onHappyCelebration
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
      // Trigger Happy celebration email if section is "today"
      if (section === 'today' && onHappyCelebration) {
        onHappyCelebration();
      }
    }
  }, [allTasksCompleted, hasShownConfetti, completedTasks.length, section, onHappyCelebration]);

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
  // Auth state
  const [authState, setAuthState] = useState('loading'); // 'loading', 'unauthenticated', 'guest', 'authenticated'
  const [user, setUser] = useState(null);
  const [supabaseSession, setSupabaseSession] = useState(null);

  // App state
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWins, setShowWins] = useState(false);

  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('taskTheme') || 'yellow');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') || 'auto');
  const recentThemesRef = useRef([]);

  // Guest mode local storage
  const [guestTasks, setGuestTasks] = useState(() => {
    const saved = localStorage.getItem('guestTasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Wins - permanent log of completed tasks
  const [wins, setWins] = useState(() => {
    const saved = localStorage.getItem('wins');
    return saved ? JSON.parse(saved) : [];
  });

  // Happy - AI email assistant settings
  const [happySettings, setHappySettings] = useState(null);

  // ============================================================
  // SUPABASE AUTH
  // ============================================================

  // Helper to get current user ID from Supabase client (not React state)
  const getCurrentUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  };

  // Initialize auth state from Supabase session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSupabaseSession(session);
        const meta = session.user.user_metadata;
        setUser({
          user_id: session.user.id,
          email: session.user.email,
          name: meta?.full_name || meta?.name || session.user.email,
          picture: meta?.avatar_url || meta?.picture || '',
        });
        setAuthState('authenticated');
      } else {
        // Check if guest mode
        const isGuest = localStorage.getItem('isGuest') === 'true';
        setAuthState(isGuest ? 'guest' : 'unauthenticated');
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSupabaseSession(session);
        const meta = session.user.user_metadata;
        setUser({
          user_id: session.user.id,
          email: session.user.email,
          name: meta?.full_name || meta?.name || session.user.email,
          picture: meta?.avatar_url || meta?.picture || '',
        });
        localStorage.removeItem('isGuest');
        setAuthState('authenticated');
      } else if (authState !== 'guest') {
        setSupabaseSession(null);
        setUser(null);
        setAuthState('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error('Google login error:', error);
        toast.error('Failed to sign in with Google');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Failed to sign in');
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('isGuest', 'true');
    setAuthState('guest');
  };

  const handleLogout = async () => {
    if (authState === 'authenticated') {
      await supabase.auth.signOut();
    }

    // Clear all auth state
    localStorage.removeItem('isGuest');
    setSupabaseSession(null);
    setUser(null);
    setCurrentProfile(null);
    setCurrentSection(null);
    setTasks([]);
    setSettingsOpen(false);
    setAuthState('unauthenticated');
    toast.success('Signed out successfully');
  };

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

  const handleRandomTheme = () => {
    const allThemes = [...COLOR_THEMES, ...SPECIAL_THEMES];
    // Exclude recently seen themes so you cycle through all before repeating
    const recentSet = new Set(recentThemesRef.current);
    let pool = allThemes.filter(t => t !== currentTheme && !recentSet.has(t));
    // If pool is exhausted, reset history and pick from all except current
    if (pool.length === 0) {
      recentThemesRef.current = [];
      pool = allThemes.filter(t => t !== currentTheme);
    }
    // Fisher-Yates-ish: pick a random one from the pool
    const newTheme = pool[Math.floor(Math.random() * pool.length)];
    // Track in recent history (keep last ~70% of total so variety stays high)
    recentThemesRef.current.push(newTheme);
    const maxRecent = Math.floor(allThemes.length * 0.7);
    if (recentThemesRef.current.length > maxRecent) {
      recentThemesRef.current = recentThemesRef.current.slice(-maxRecent);
    }
    setCurrentTheme(newTheme);
    localStorage.setItem('taskTheme', newTheme);
    return newTheme;
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

  // Save guest tasks to localStorage
  useEffect(() => {
    if (authState === 'guest') {
      localStorage.setItem('guestTasks', JSON.stringify(guestTasks));
    }
  }, [guestTasks, authState]);

  // Save wins to localStorage (for guest mode)
  useEffect(() => {
    if (authState === 'guest') {
      localStorage.setItem('wins', JSON.stringify(wins));
    }
  }, [wins, authState]);

  const addWin = useCallback(async (task) => {
    const winTitle = task.title.split('\n')[0];
    const completedAt = new Date().toISOString();

    if (authState === 'authenticated') {
      try {
        const userId = await getCurrentUserId();
        if (!userId) return;
        const { data, error } = await supabase
          .from('wins')
          .insert({ user_id: userId, task: winTitle, completed_at: completedAt })
          .select()
          .single();
        if (!error && data) {
          setWins(prev => [data, ...prev]);
        } else if (error) {
          console.error('Supabase wins insert error:', error.message);
        }
      } catch (err) {
        console.error('Failed to save win:', err);
      }
    } else {
      const win = {
        id: `win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        task: winTitle,
        completed_at: completedAt,
      };
      setWins(prev => [win, ...prev]);
    }
  }, [authState]);

  // Fetch wins for authenticated users
  const fetchWins = useCallback(async () => {
    if (authState !== 'authenticated') return;
    try {
      const { data, error } = await supabase
        .from('wins')
        .select('*')
        .order('completed_at', { ascending: false });
      if (!error && data) {
        setWins(data);
      }
    } catch (err) {
      console.error('Failed to fetch wins:', err);
    }
  }, [authState]);

  // Load wins when authenticated
  useEffect(() => {
    if (authState === 'authenticated') {
      fetchWins();
    }
  }, [authState, fetchWins]);

  // ============================================================
  // HAPPY - AI EMAIL ASSISTANT
  // ============================================================

  const fetchHappySettings = useCallback(async () => {
    if (authState !== 'authenticated') return;
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      const { data } = await supabase
        .from('happy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) {
        setHappySettings(data);
      } else {
        // No settings yet - show as disabled
        setHappySettings({ enabled: false, name: '', email: '' });
      }
    } catch {
      setHappySettings({ enabled: false, name: '', email: '' });
    }
  }, [authState]);

  useEffect(() => {
    if (authState === 'authenticated') {
      fetchHappySettings();
    }
  }, [authState, fetchHappySettings]);

  const handleHappyToggle = async () => {
    if (authState !== 'authenticated') return;
    const userId = await getCurrentUserId();
    if (!userId) return;

    const newEnabled = !happySettings?.enabled;

    if (!happySettings?.id) {
      // First time enabling - create with user's email and detected timezone
      const { data, error } = await supabase
        .from('happy_settings')
        .insert({
          user_id: userId,
          enabled: true,
          name: user?.name || 'Friend',
          email: user?.email || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .select()
        .single();
      if (!error && data) {
        setHappySettings(data);
        toast.success("Happy activated! 🎉");
      } else {
        toast.error("Failed to enable Happy");
      }
    } else {
      // Toggle existing
      const { data, error } = await supabase
        .from('happy_settings')
        .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
        .eq('id', happySettings.id)
        .select()
        .single();
      if (!error && data) {
        setHappySettings(data);
        toast.success(newEnabled ? "Happy activated! 🎉" : "Happy paused");
      }
    }
  };

  const handleHappySave = async (name, email, timezone, location) => {
    if (!happySettings?.id) return;
    const { data, error } = await supabase
      .from('happy_settings')
      .update({ name, email, timezone, location, updated_at: new Date().toISOString() })
      .eq('id', happySettings.id)
      .select()
      .single();
    if (!error && data) {
      setHappySettings(data);
      toast.success("Happy settings saved!");
    } else {
      toast.error("Failed to save settings");
    }
  };

  // Track app open for inactivity detection
  useEffect(() => {
    if (authState !== 'authenticated') return;
    const updateLastOpen = async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await supabase
        .from('user_settings')
        .upsert({ user_id: userId, last_app_open: new Date().toISOString() }, { onConflict: 'user_id' });
    };
    updateLastOpen();
  }, [authState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger celebration email when all today tasks are completed
  const triggerHappyCelebration = useCallback(async () => {
    if (authState !== 'authenticated' || !happySettings?.enabled) return;
    const userId = await getCurrentUserId();
    if (!userId) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hyjkrbnsftuouaitbdkr.supabase.co';
      await fetch(`${supabaseUrl}/functions/v1/happy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amtyYm5zZnR1b3VhaXRiZGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NjAzNDUsImV4cCI6MjA1MzUzNjM0NX0.aHWnS2VFMuRCgjpKxTVjiPJmyMXxnTv5SjPPkuyMbwA'}` },
        body: JSON.stringify({ job_type: 'celebration', user_id: userId }),
      });
    } catch (err) {
      console.error('Happy celebration trigger error:', err);
    }
  }, [authState, happySettings]);

  const fetchTasks = useCallback(async (profile) => {
    if (!profile) return;

    if (authState === 'guest') {
      setTasks(guestTasks.filter(t => t.profile === profile));
      return;
    }

    if (authState === 'authenticated') {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('profile', profile)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setTasks(data);
        } else {
          toast.error("Failed to load tasks");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }
  }, [authState, guestTasks]);

  useEffect(() => {
    if (currentProfile && (authState === 'authenticated' || authState === 'guest')) {
      fetchTasks(currentProfile);
    }
  }, [currentProfile, fetchTasks, authState]);

  const handleAddTask = async (title, section) => {
    if (authState === 'guest') {
      const newTask = {
        id: `local_${Date.now()}`,
        title,
        profile: currentProfile,
        section,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setGuestTasks(prev => [...prev, newTask]);
      setTasks(prev => [...prev, newTask]);
      toast.success("Task added!");
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error("Not authenticated");
        return;
      }
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: userId, title, profile: currentProfile, section })
        .select()
        .single();
      if (!error && data) {
        setTasks(prev => [...prev, data]);
        toast.success("Task added!");
      } else {
        console.error("Supabase insert error:", error?.message);
        toast.error(error?.message || "Failed to add task");
      }
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  const handleToggleTask = async (task) => {
    if (authState === 'guest') {
      const updatedTask = { ...task, completed: !task.completed, updated_at: new Date().toISOString() };
      setGuestTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      if (!task.completed) addWin(task);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed, updated_at: new Date().toISOString() })
        .eq('id', task.id)
        .select()
        .single();
      if (!error && data) {
        setTasks(prev => prev.map(t => t.id === task.id ? data : t));
        if (!task.completed) addWin(task);
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    if (authState === 'guest') {
      const updatedTask = { ...tasks.find(t => t.id === taskId), ...updates, updated_at: new Date().toISOString() };
      setGuestTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      toast.success("Task updated!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();
      if (!error && data) {
        setTasks(prev => prev.map(t => t.id === taskId ? data : t));
        toast.success("Task updated!");
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (authState === 'guest') {
      setGuestTasks(prev => prev.filter(t => t.id !== taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task deleted!");
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success("Task deleted!");
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleClearCompleted = async (section) => {
    const completedTasks = tasks.filter((t) => t.section === section && t.completed);

    if (authState === 'guest') {
      setGuestTasks(prev => prev.filter(t => !(t.section === section && t.completed)));
      setTasks(prev => prev.filter(t => !(t.section === section && t.completed)));
      toast.success("Completed tasks cleared!");
      return;
    }

    try {
      const ids = completedTasks.map(t => t.id);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', ids);
      if (!error) {
        setTasks(prev => prev.filter(t => !(t.section === section && t.completed)));
        toast.success("Completed tasks cleared!");
      } else {
        toast.error("Failed to clear tasks");
      }
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

  // Loading state
  if (authState === 'loading') {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // Unauthenticated - show login screen
  if (authState === 'unauthenticated') {
    return (
      <div className="app-container">
        <Toaster position="top-center" richColors />
        <LoginScreen
          onGoogleLogin={handleGoogleLogin}
          onGuestMode={handleGuestMode}
          isLoading={false}
        />
      </div>
    );
  }

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
      
      {showWins ? (
        <WinsScreen
          wins={wins}
          onBack={() => setShowWins(false)}
        />
      ) : !currentProfile ? (
        <LandingScreen
          onSelectProfile={setCurrentProfile}
          userName={user?.name}
        />
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
          onHappyCelebration={triggerHappyCelebration}
        />
      ) : (
        <ProfileScreen
          profile={currentProfile}
          tasks={tasks}
          onBack={handleBackFromProfile}
          onSelectSection={setCurrentSection}
          onOpenSettings={() => setSettingsOpen(true)}
          theme={currentTheme}
          onRandomTheme={handleRandomTheme}
          onOpenWins={() => setShowWins(true)}
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
        user={user}
        isGuest={authState === 'guest'}
        onLogout={handleLogout}
        happySettings={happySettings}
        onHappyToggle={handleHappyToggle}
        onHappySave={handleHappySave}
      />
    </div>
  );
}

export default App;
