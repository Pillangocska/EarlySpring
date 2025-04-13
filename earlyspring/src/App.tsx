// src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components
import Login from './components/auth/Login';
import AlarmDashboard from './components/alarm/AlarmDashboard';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ProtectedRoute: Auth state changed", {
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading,
      user: authState.user?.name
    });

    if (!authState.loading && !authState.isAuthenticated) {
      console.log("ProtectedRoute: Redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [authState, navigate]);

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Loading</h1>
        <p className="text-gray-400">Please wait...</p>
      </div>
    );
  }

  return authState.isAuthenticated ? <>{children}</> : null;
};

// Login route wrapper
const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("LoginRoute: Auth state changed", {
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading
    });

    if (!authState.loading && authState.isAuthenticated) {
      console.log("LoginRoute: Redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [authState, navigate]);

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Loading</h1>
        <p className="text-gray-400">Please wait...</p>
      </div>
    );
  }

  return !authState.isAuthenticated ? <>{children}</> : null;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginRoute>
            <Login />
          </LoginRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AlarmDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
