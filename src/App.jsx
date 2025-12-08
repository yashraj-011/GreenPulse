import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import SafeRoutes from './pages/SafeRoutes';
import Community from './pages/Community';
import Profile from "./components/Profile";



function App() {
  const [user, setUser] = useState(null); // {name,email,role}
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  const AppLayout = ({ children }) => (
  <div className="app-shell">
    <Navbar user={user} onLogout={handleLogout} />
    <main className="pt-20 px-4 md:px-8 pb-8 max-w-6xl mx-auto">{children}</main>
  </div>
);

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login onSuccess={handleAuthSuccess} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <Signup onSuccess={handleAuthSuccess} />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/safe-routes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SafeRoutes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Community />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
