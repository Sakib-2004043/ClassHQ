import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  StudentDashboardStats, 
  AttendanceRecord, 
  LeaveRequest, 
  LeaveType, 
  SectionCaptainInfo 
} from '../../types';
import { StudentNavbar } from './components/StudentNavbar';
import { StudentOverviewView } from './components/StudentOverviewView';
import { StudentAttendanceView } from './components/StudentAttendanceView';
import { StudentLeaveView } from './components/StudentLeaveView';
import { StudentProfileView } from './components/StudentProfileView';

export const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [captains, setCaptains] = useState<SectionCaptainInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentId = user?.userId;
      const userBatch = user?.batch;
      const userSection = user?.section;

      const [statsRes, attRes, leavesRes, captainRes] = await Promise.all([
        api.getStudentStats(studentId).catch(() => null),
        api.getStudentAttendance(studentId).catch(() => ({ records: [] })),
        api.getStudentLeaves(studentId).catch(() => ({ leaves: [] })),
        api.getStudentCaptainInfo(userBatch, userSection).catch(() => ({ batch: '', section: '', captains: [] })),
      ]);

      if (statsRes) setStats(statsRes);
      if (attRes?.records) setRecords(attRes.records);
      if (leavesRes?.leaves) setLeaves(leavesRes.leaves);
      if (captainRes?.captains) setCaptains(captainRes.captains);
    } catch (err: any) {
      console.error('Error fetching student data:', err);
      setError(err.message || 'Failed to load student data from database.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleSubmitLeave = async (data: {
    leaveType: LeaveType;
    date?: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    try {
      const res = await api.submitLeaveRequest(data);
      if (res.success) {
        await fetchStudentData();
        return { success: true, message: res.message };
      }
      return { success: false, error: 'Submission failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit leave request.' };
    }
  };

  const handleUpdateLeave = async (
    id: string,
    data: {
      leaveType?: LeaveType;
      date?: string;
      startDate?: string;
      reason?: string;
    }
  ) => {
    try {
      const res = await api.updateLeaveRequest(id, data);
      if (res.success) {
        await fetchStudentData();
        return { success: true, message: res.message };
      }
      return { success: false, error: 'Update failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update leave request.' };
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9f5] text-slate-800 font-sans antialiased relative selection:bg-emerald-500 selection:text-white pb-16">
      {/* Aesthetic Light Green Ambient Glow Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[55%] h-[55%] rounded-full bg-emerald-200/40 blur-[130px]" />
        <div className="absolute top-[30%] -right-[15%] w-[50%] h-[50%] rounded-full bg-teal-100/50 blur-[140px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-green-200/30 blur-[150px]" />
      </div>

      <div className="relative z-10">
        <StudentNavbar attendancePercentage={stats?.attendancePercentage} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-xs">
              {error}
            </div>
          )}

          <Routes>
            <Route
              path="/"
              element={
                <StudentOverviewView
                  stats={stats}
                  records={records}
                  leaves={leaves}
                  captains={captains}
                  loading={loading}
                  onOpenLeaveModal={() => navigate('/student/attendance')}
                />
              }
            />
            <Route
              path="/attendance"
              element={
                <StudentAttendanceView
                  records={records}
                  leaves={leaves}
                  captains={captains}
                  onSubmitLeave={handleSubmitLeave}
                  onUpdateLeave={handleUpdateLeave}
                  onRefreshData={fetchStudentData}
                  loading={loading}
                />
              }
            />
            <Route path="/leave" element={<Navigate to="/student/attendance" replace />} />
            <Route
              path="/profile"
              element={
                <StudentProfileView
                  stats={stats}
                  captains={captains}
                />
              }
            />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
