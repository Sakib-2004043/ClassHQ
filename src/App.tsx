/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './portals/auth/AuthPage';
import { StudentPortal } from './portals/student/StudentPortal';
import { CaptainPortal } from './portals/captain/CaptainPortal';
import { AdminPortal } from './portals/admin/AdminPortal';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: ('student' | 'captain' | 'admin')[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Loading ClassHQ...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'captain') return <Navigate to="/captain" replace />;
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects logged-in users to their respective portal)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'captain') return <Navigate to="/captain" replace />;
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
};

// Root index redirector
const RootRedirector: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-900 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Initializing ClassHQ...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'captain') return <Navigate to="/captain" replace />;
    return <Navigate to="/student" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthPage initialTab="login" />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <AuthPage initialTab="register" />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/auth"
            element={
              <PublicOnlyRoute>
                <AuthPage initialTab="login" />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Portal Routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student', 'captain', 'admin']}>
                <StudentPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/captain/*"
            element={
              <ProtectedRoute allowedRoles={['captain', 'admin']}>
                <CaptainPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Root and Fallback */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
