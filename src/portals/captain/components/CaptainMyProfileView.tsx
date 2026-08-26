import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  GraduationCap, 
  Hash, 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { StudentDashboardStats } from '../../../types';

export const CaptainMyProfileView: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Change Password State (Self-contained for Captain Portal)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(res.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('Failed to change password. Please check your credentials.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error changing password.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const fetchPersonalData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const statsRes = await api.getStudentStats(user.userId).catch(() => null);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.error('Error fetching captain personal student stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPersonalData();
  }, [fetchPersonalData]);

  if (!user) return null;

  const currentBatch = user.assignedBatch || user.batch || 'HSC 2026';
  const currentSection = user.assignedSection || user.section || 'A';

  return (
    <div className="space-y-2.5 sm:space-y-4 max-w-5xl mx-auto">
      {/* Top Banner with Captain & Student Identity */}
      <div className="p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 text-white rounded-2xl border border-sky-800/60 shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-black text-base sm:text-xl shadow-md shrink-0 border border-white/20">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white truncate">
                  {user.fullName}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-200 border border-sky-400/30 inline-flex items-center gap-0.5 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-sky-400" />
                  Captain & Student
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-0.5 shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  Active
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-sky-200/80 flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                <span className="flex items-center gap-0.5">
                  <Hash className="w-3 h-3 text-sky-400" />
                  Roll: <span className="font-mono text-white font-bold">{user.rollNumber}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <GraduationCap className="w-3 h-3 text-sky-400" />
                  {currentBatch}
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Award className="w-3 h-3 text-sky-400" />
                  Sec {currentSection}
                </span>
                {user.group && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-white">
                      <BookOpen className="w-3 h-3 text-sky-400" />
                      {user.group}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md shrink-0 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-sky-300">
                Personal Attendance
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                {stats ? `${stats.attendancePercentage}%` : '--'}
              </div>
              <p className="text-[9px] text-sky-200/70 font-semibold">
                {stats ? `${stats.daysPresent} of ${stats.totalDays} sessions` : 'Loading...'}
              </p>
            </div>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
              (stats?.attendancePercentage ?? 100) >= 75 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
            }`}>
              {(stats?.attendancePercentage ?? 100) >= 75 ? '✓' : '!'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile & Security Layout */}
      <div className="space-y-2.5 sm:space-y-3.5">
        {/* 4 Metrics KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-sky-200/80 shadow-2xs space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Attendance</span>
              <Award className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {stats ? `${stats.attendancePercentage}%` : '0%'}
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 truncate">
              {stats && stats.totalDays > 0 ? `${stats.daysPresent} of ${stats.totalDays} sessions` : 'No sessions'}
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-sky-200/80 shadow-2xs space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Days Present</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600">
              {stats ? stats.daysPresent : 0}
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 truncate">Regular attendance</p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-sky-200/80 shadow-2xs space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Days Absent</span>
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-rose-600">
              {stats ? stats.daysAbsent : 0}
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 truncate">
              {stats ? `${stats.daysLate} late entries` : '0 late entries'}
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-sky-200/80 shadow-2xs space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Leaves Granted</span>
              <FileText className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-sky-600">
              {stats ? stats.approvedLeaves : 0}
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 truncate">
              {stats ? `${stats.pendingLeaves} pending` : '0 pending'}
            </p>
          </div>
        </div>

        {/* Academic & Contact Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
          {/* Academic Information */}
          <div className="p-3 sm:p-4 bg-white rounded-2xl border border-sky-200/80 shadow-2xs space-y-2">
            <h3 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
              Academic Enrollment & Responsibilities
            </h3>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">HSC Batch</span>
                <span className="text-xs sm:text-[13px] font-black text-slate-900">{currentBatch}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Section</span>
                <span className="text-xs sm:text-[13px] font-black text-sky-700 font-bold">Section {currentSection}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Academic Group</span>
                <span className="text-xs sm:text-[13px] font-black text-slate-900">{user.group || 'Science'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Official Role</span>
                <span className="text-xs sm:text-[13px] font-black text-emerald-700">Section Captain</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-3 sm:p-4 bg-white rounded-2xl border border-sky-200/80 shadow-2xs space-y-2">
            <h3 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              Institutional & Contact Details
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <div className="overflow-hidden">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Email</span>
                  <span className="text-[11px] font-bold text-slate-900 truncate block">{user.email}</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Phone</span>
                  <span className="text-[11px] font-bold text-slate-900">{user.phoneNumber || '+880 1700-000000'}</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Address</span>
                  <span className="text-[11px] font-bold text-slate-900">{user.address || 'Dhaka, Bangladesh'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Captain Portal Change Password Security Card */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-950 via-slate-900 to-sky-900 text-white shadow-lg border border-sky-800/80 space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-2 border-b border-sky-800/80 pb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white tracking-tight">Security & Change Password</h3>
                <p className="text-[10px] text-sky-200/80">Manage your Section Captain portal access password</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
              Captain Credentials
            </span>
          </div>

          {passwordError && (
            <div className="relative z-10 p-2 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="relative z-10 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="relative z-10 space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-sky-400" />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/70 border border-sky-700/60 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-sky-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/70 border border-sky-700/60 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-400" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/70 border border-sky-700/60 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={changePasswordLoading}
                className="h-8.5 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {changePasswordLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-white" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
