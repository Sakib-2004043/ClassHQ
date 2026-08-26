import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AdminOverviewStats, User, ApprovalStatus } from '../../types';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminStudentsView } from './components/AdminStudentsView';
import { AdminPendingStudentsView } from './components/AdminPendingStudentsView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';
import { AdminProfileView } from './components/AdminProfileView';
import { AdminSettingsView } from './components/AdminSettingsView';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, studentsRes] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getAdminStudents({}).catch(() => ({ students: [], total: 0 })),
      ]);

      if (statsRes) setStats(statsRes);
      if (studentsRes?.students) setStudents(studentsRes.students);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Failed to fetch administrative records from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleUpdateStudentApproval = async (id: string, approval: ApprovalStatus) => {
    try {
      const res = await api.updateStudentApproval(id, approval);
      if (res.success) {
        await fetchAdminData();
        return { success: true, message: res.message };
      }
      return { success: false };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleUpdateUserRole = async (id: string, role: 'student' | 'captain', assignedBatch?: string, assignedSection?: string) => {
    try {
      const res = await api.updateUserRole(id, role, assignedBatch, assignedSection);
      if (res.success) {
        await fetchAdminData();
        return { success: true, message: res.message };
      }
      return { success: false };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleUpdateUserSection = async (id: string, section: string, batch?: string) => {
    try {
      const res = await api.updateUserSection(id, section, batch);
      if (res.success) {
        await fetchAdminData();
        return { success: true, message: res.message };
      }
      return { success: false, message: 'Failed to update section.' };
    } catch (err: any) {
      return { success: false, error: err.message, message: err.message };
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(244,63,94,0.12),rgba(255,255,255,0))] text-slate-900 font-sans antialiased relative selection:bg-rose-500 selection:text-white">
      {/* Subtle Light Red Ambient Glow Grids */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_500px_at_10%_20%,rgba(244,63,94,0.06),transparent)] z-0" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_600px_at_90%_80%,rgba(225,29,72,0.05),transparent)] z-0" />

      <AdminNavbar
        pendingStudentsCount={stats?.pendingStudentApprovals}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold shadow-xs">
            {error}
          </div>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/admin/students" replace />} />
          <Route path="/overview" element={<Navigate to="/admin/students" replace />} />
          <Route
            path="/students"
            element={
              <AdminStudentsView
                students={students}
                stats={stats}
                onUpdateApproval={handleUpdateStudentApproval}
                onUpdateRole={handleUpdateUserRole}
                onRefresh={fetchAdminData}
                loading={loading}
              />
            }
          />
          <Route
            path="/pending-students"
            element={
              <AdminPendingStudentsView
                students={students}
                stats={stats}
                onUpdateApproval={handleUpdateStudentApproval}
                onUpdateRole={handleUpdateUserRole}
                onRefresh={fetchAdminData}
                loading={loading}
              />
            }
          />
          <Route
            path="/analytics"
            element={<AdminAnalyticsView stats={stats} loading={loading} />}
          />
          <Route
            path="/profile"
            element={<AdminProfileView />}
          />
          <Route
            path="/settings"
            element={<AdminSettingsView />}
          />
          <Route path="*" element={<Navigate to="/admin/students" replace />} />
        </Routes>
      </main>
    </div>
  );
};
