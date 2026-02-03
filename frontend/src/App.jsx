import { useState, useEffect, useCallback } from "react";
import "./App.css";
// import axios from "axios"; // STANDALONE_MODE: Commented out - not needed for localStorage-only mode
import { Toaster, toast } from "sonner";
import { Settings, ArrowLeft, Check, Trash2, X, Sun, Moon, Monitor, LogOut, User } from "lucide-react";
import confetti from "canvas-confetti";

// ============================================================
// STANDALONE MODE CONFIGURATION
// ============================================================
// Set to `true` for Vercel/static hosting (localStorage only, no backend)
// Set to `false` to enable full backend + Google Auth features
const STANDALONE_MODE = true;
// ============================================================

// Backend configuration (only used when STANDALONE_MODE = false)
// In Vite, use import.meta.env instead of process.env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Google OAuth configuration - Emergent Auth (only used when STANDALONE_MODE = false)
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const EMERGENT_AUTH_URL = "https://auth.emergentagent.com/";

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
    tomorrow: { image: "/emojis/flamingo.png", label: "tomorrow", placeholder: "tomorrow I will..." },
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
  "almost", "cozy", "doubt"
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
const LoginScreen = ({ onGoogleLogin, onGuestMode, isLoading, standaloneMode }) => {
  return (
    <div className="login-screen" data-testid="login-screen">
      <div className="login-content">
        <h1 className="login-title">can-do</h1>
        <p className="login-tagline">
          One task at a time,
          <br />
          you&apos;ve got this.
        </p>
      </div>
      
      <div className="login-buttons">
        {/* Google Login - disabled in standalone mode */}
        {!standaloneMode ? (
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
        ) : (
          <button 
            className="google-login-btn disabled" 
            disabled={true}
            data-testid="google-login-btn-disabled"
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google Sign-in (Coming Soon)</span>
          </button>
        )}
        
        <button 
          className="guest-mode-btn" 
          onClick={onGuestMode}
          disabled={isLoading}
          data-testid="guest-mode-btn"
        >
          <User size={20} />
          <span>{standaloneMode ? 'Get Started' : 'Continue as Guest'}</span>
        </button>
      </div>
      
      <p className="login-hint">
        {standaloneMode ? 'Your tasks are saved locally on this device' : 'Guest mode saves tasks locally on this device'}
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
  // Auth state
  const [authState, setAuthState] = useState('loading'); // 'loading', 'unauthenticated', 'guest', 'authenticated'
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem('sessionToken'));
  
  // App state
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('taskTheme') || 'yellow');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') || 'auto');
  
  // Guest mode local storage (used for all tasks in STANDALONE_MODE)
  const [guestTasks, setGuestTasks] = useState(() => {
    const saved = localStorage.getItem('guestTasks');
    return saved ? JSON.parse(saved) : [];
  });

  // ============================================================
  // BACKEND AUTH FUNCTIONS (Only used when STANDALONE_MODE = false)
  // ============================================================
  
  /* STANDALONE_MODE: These functions are commented out for static deployment
   * Uncomment and set STANDALONE_MODE = false to enable backend features
   */
  
  const checkSession = useCallback(async (token) => {
    // STANDALONE_MODE: Skip backend session check
    if (STANDALONE_MODE) {
      setAuthState('unauthenticated');
      return;
    }
    
    /* Backend session check - uncomment when STANDALONE_MODE = false
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setAuthState('authenticated');
    } catch (error) {
      console.error('Session check failed:', error);
      localStorage.removeItem('sessionToken');
      setSessionToken(null);
      setAuthState('unauthenticated');
    }
    */
    
    // For now, just set unauthenticated
    localStorage.removeItem('sessionToken');
    setSessionToken(null);
    setAuthState('unauthenticated');
  }, []);

  const handleOAuthCallback = useCallback(async (sessionId) => {
    // STANDALONE_MODE: Skip OAuth callback
    if (STANDALONE_MODE) {
      setAuthState('unauthenticated');
      return;
    }
    
    /* Backend OAuth callback - uncomment when STANDALONE_MODE = false
    try {
      const axios = (await import('axios')).default;
      const response = await axios.post(`${API}/auth/session`, { session_id: sessionId }, {
        withCredentials: true
      });
      const userData = response.data;
      
      const token = userData.session_token;
      if (token) {
        localStorage.setItem('sessionToken', token);
      }
      localStorage.removeItem('isGuest');
      setSessionToken(token);
      setUser(userData);
      setAuthState('authenticated');
      toast.success(`Welcome, ${userData.name}!`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Failed to sign in. Please try again.');
      setAuthState('unauthenticated');
    }
    */
    
    setAuthState('unauthenticated');
  }, []);

  // ============================================================
  // AUTH STATE INITIALIZATION
  // ============================================================

  // Check for OAuth callback - session_id comes in URL fragment (hash)
  useEffect(() => {
    // STANDALONE_MODE: Skip OAuth detection, just check for guest mode
    if (STANDALONE_MODE) {
      const isGuest = localStorage.getItem('isGuest') === 'true';
      if (isGuest) {
        setAuthState('guest');
      } else {
        setAuthState('unauthenticated');
      }
      return;
    }
    
    // Check URL fragment for session_id (format: #session_id=xxx)
    const hash = window.location.hash;
    let sessionId = null;
    
    if (hash && hash.includes('session_id=')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      sessionId = hashParams.get('session_id');
    }
    
    // Also check query params as fallback
    if (!sessionId) {
      const urlParams = new URLSearchParams(window.location.search);
      sessionId = urlParams.get('session_id');
    }
    
    if (sessionId) {
      // Clear URL params/hash
      window.history.replaceState({}, document.title, window.location.pathname);
      handleOAuthCallback(sessionId);
    } else if (sessionToken) {
      // Try to restore session
      checkSession(sessionToken);
    } else {
      // Check if guest mode
      const isGuest = localStorage.getItem('isGuest') === 'true';
      if (isGuest) {
        setAuthState('guest');
      } else {
        setAuthState('unauthenticated');
      }
    }
  }, [sessionToken, checkSession, handleOAuthCallback]);

  const handleGoogleLogin = () => {
    // STANDALONE_MODE: Skip Google login
    if (STANDALONE_MODE) {
      toast.error('Google login not available in standalone mode');
      return;
    }
    
    /* Backend Google login - uncomment when STANDALONE_MODE = false
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${EMERGENT_AUTH_URL}?redirect=${redirectUrl}`;
    */
  };

  const handleGuestMode = () => {
    localStorage.setItem('isGuest', 'true');
    setAuthState('guest');
  };

  const handleLogout = async () => {
    if (authState === 'authenticated' && sessionToken && !STANDALONE_MODE) {
      /* Backend logout - uncomment when STANDALONE_MODE = false
      try {
        const axios = (await import('axios')).default;
        await axios.post(`${API}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
      */
    }
    
    // Clear all auth state
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('isGuest');
    setSessionToken(null);
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

  const fetchTasks = useCallback(async (profile) => {
    if (!profile) return;
    
    if (authState === 'guest' || STANDALONE_MODE) {
      // For guest mode or standalone mode, filter from local tasks
      setTasks(guestTasks.filter(t => t.profile === profile));
      return;
    }
    
    /* Backend task fetching - uncomment when STANDALONE_MODE = false
    setLoading(true);
    try {
      const axios = (await import('axios')).default;
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      const response = await axios.get(`${API}/tasks/${profile}`, { headers });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
    */
  }, [authState, sessionToken, guestTasks]);

  useEffect(() => {
    if (currentProfile && (authState === 'authenticated' || authState === 'guest')) {
      fetchTasks(currentProfile);
    }
  }, [currentProfile, fetchTasks, authState]);

  const handleAddTask = async (title, section) => {
    if (authState === 'guest' || STANDALONE_MODE) {
      // Local task creation for guest/standalone mode
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
    
    /* Backend task creation - uncomment when STANDALONE_MODE = false
    try {
      const axios = (await import('axios')).default;
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      const response = await axios.post(`${API}/tasks`, {
        title,
        profile: currentProfile,
        section,
      }, { headers });
      setTasks([...tasks, response.data]);
      toast.success("Task added!");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
    */
  };

  const handleToggleTask = async (task) => {
    if (authState === 'guest' || STANDALONE_MODE) {
      // Local toggle for guest/standalone mode
      const updatedTask = { ...task, completed: !task.completed, updated_at: new Date().toISOString() };
      setGuestTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      return;
    }
    
    /* Backend task toggle - uncomment when STANDALONE_MODE = false
    try {
      const axios = (await import('axios')).default;
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      const response = await axios.patch(`${API}/tasks/${task.id}`, {
        completed: !task.completed,
      }, { headers });
      setTasks(tasks.map((t) => (t.id === task.id ? response.data : t)));
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
    */
  };

  const handleUpdateTask = async (taskId, updates) => {
    if (authState === 'guest' || STANDALONE_MODE) {
      // Local update for guest/standalone mode
      const updatedTask = { ...tasks.find(t => t.id === taskId), ...updates, updated_at: new Date().toISOString() };
      setGuestTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      toast.success("Task updated!");
      return;
    }
    
    /* Backend task update - uncomment when STANDALONE_MODE = false
    try {
      const axios = (await import('axios')).default;
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      const response = await axios.patch(`${API}/tasks/${taskId}`, updates, { headers });
      setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
      toast.success("Task updated!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
    */
  };

  const handleDeleteTask = async (taskId) => {
    if (authState === 'guest' || STANDALONE_MODE) {
      // Local delete for guest/standalone mode
      setGuestTasks(prev => prev.filter(t => t.id !== taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task deleted!");
      return;
    }
    
    /* Backend task deletion - uncomment when STANDALONE_MODE = false
    try {
      const axios = (await import('axios')).default;
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      await axios.delete(`${API}/tasks/${taskId}`, { headers });
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast.success("Task deleted!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
    */
  };

  const handleClearCompleted = async (section) => {
    const completedTasks = tasks.filter((t) => t.section === section && t.completed);
    
    if (authState === 'guest' || STANDALONE_MODE) {
      // Local clear for guest/standalone mode
      setGuestTasks(prev => prev.filter(t => !(t.section === section && t.completed)));
      setTasks(prev => prev.filter(t => !(t.section === section && t.completed)));
      toast.success("Completed tasks cleared!");
      return;
    }
    
    /* Backend task clearing - uncomment when STANDALONE_MODE = false
    try {
      const axios = (await import('axios')).default;
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      await Promise.all(completedTasks.map((t) => axios.delete(`${API}/tasks/${t.id}`, { headers })));
      setTasks(tasks.filter((t) => !(t.section === section && t.completed)));
      toast.success("Completed tasks cleared!");
    } catch (error) {
      console.error("Error clearing tasks:", error);
      toast.error("Failed to clear tasks");
    }
    */
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
          standaloneMode={STANDALONE_MODE}
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
      
      {!currentProfile ? (
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
        user={user}
        isGuest={authState === 'guest'}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
