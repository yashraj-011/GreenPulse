import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import SafeRoutes from './pages/SafeRoutes';
import Community from './pages/Community';
import PolicyDashboard from './pages/PolicyDashboard';
import AdminPanel from './pages/AdminPanel';
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

    // Redirect admin users to admin panel, regular users to dashboard
    if (userData.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
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

  const AdminRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') {
      return (
        <AppLayout>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Admin Access Required</h1>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                You need admin privileges to access this page.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </AppLayout>
      );
    }
    return children;
  };

  const AppLayout = ({ children }) => (
  <div className="app-shell">
    <Navbar user={user} onLogout={handleLogout} />
    <main className="pt-20 px-4 md:px-8 pb-8 max-w-6xl mx-auto">{children}</main>
  </div>
);

  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login onSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Signup onSuccess={handleAuthSuccess} />}
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
              {user?.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <AppLayout>
                  <Community user={user} />
                </AppLayout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminPanel />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/policy"
          element={
            <AdminRoute>
              <AppLayout>
                <PolicyDashboard />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile user={user} onLogout={handleLogout} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to={
                user
                  ? (user.role === 'admin' ? '/admin' : '/dashboard')
                  : '/login'
              }
              replace
            />
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={user?.role === 'admin' ? '/admin' : '/dashboard'}
              replace
            />
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
