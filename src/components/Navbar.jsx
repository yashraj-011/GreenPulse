import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Home,
  Route,
  MessageCircle,
  User
} from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home },
    { id: 'safe-routes', label: 'Safe Routes', path: '/safe-routes', icon: Route },
    { id: 'community', label: 'Community', path: '/community', icon: MessageCircle },
    { id: 'profile', label: 'Profile', path: '/profile', icon: User }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
      <div className="h-16 max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">

        {/* Left: logo + title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            {/* --- YOUR CUSTOM LOGO --- */}
            <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-white dark:bg-slate-800">
              <img
                src="/logo.jpg"   // <-- make sure logo file is inside public/logo.png
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">GreenPulse</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Delhi NCR</p>
            </div>
          </button>
        </div>

        {/* Center: nav pills */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`nav-pill ${active ? 'nav-pill-active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: dark mode toggle + user */}
        <div className="flex items-center gap-3">
          <DarkModeToggle />

          <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
            <Bell size={16} />
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-600 flex items-center justify-center text-white hover:bg-slate-800 dark:hover:bg-slate-500">
                  <User size={14} />
                </div>
              </button>

              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
