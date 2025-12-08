// src/components/DarkModeToggle.jsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const DarkModeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        relative inline-flex items-center justify-center
        w-12 h-12 rounded-lg
        bg-slate-100 hover:bg-slate-200
        dark:bg-slate-800 dark:hover:bg-slate-700
        border border-slate-200 dark:border-slate-700
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-slate-900
        ${className}
      `}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon for light mode */}
        <Sun
          className={`
            absolute inset-0 w-5 h-5 text-yellow-500
            transition-all duration-300 transform
            ${isDarkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
          `}
        />

        {/* Moon icon for dark mode */}
        <Moon
          className={`
            absolute inset-0 w-5 h-5 text-slate-700 dark:text-slate-300
            transition-all duration-300 transform
            ${isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
          `}
        />
      </div>
    </button>
  );
};

export default DarkModeToggle;